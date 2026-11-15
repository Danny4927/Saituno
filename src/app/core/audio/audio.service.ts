import { Injectable, OnDestroy, signal } from '@angular/core';
import { AudioStatus, PitchMeasurement, WorkletMeasurementMessage } from './audio.models';
import { frequencyToPitch } from './pitch-math';

@Injectable({ providedIn: 'root' })
export class AudioService implements OnDestroy {
  private readonly _status = signal<AudioStatus>('idle');
  private readonly _measurement = signal<PitchMeasurement | null>(null);
  private readonly _errorMessage = signal<string | null>(null);

  readonly status = this._status.asReadonly();
  readonly measurement = this._measurement.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private silentGain: GainNode | null = null;
  private recentFrequencies: number[] = [];
  private startInProgress = false;
  private receivedWorkletMessage = false;
  private startupTimer: ReturnType<typeof setTimeout> | null = null;

  async start(): Promise<void> {
    if (this._status() === 'suspended' && this.audioContext) {
      try {
        await this.audioContext.resume();
        if (this.audioContext.state === 'running') {
          this._status.set('listening');
          this._errorMessage.set(null);
          return;
        }
      } catch {
        // Fall through and rebuild the audio graph below.
      }
      await this.releaseAudioResources();
    }
    if (this._status() === 'listening' || this.startInProgress) return;

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioContext === 'undefined' ||
      typeof AudioWorkletNode === 'undefined'
    ) {
      this._status.set('unsupported');
      this._errorMessage.set('Dieser Browser unterstützt die benötigte Audiofunktion nicht.');
      return;
    }

    this.startInProgress = true;
    this._status.set('requesting');
    this._measurement.set(null);
    this._errorMessage.set(null);
    this.recentFrequencies = [];
    this.receivedWorkletMessage = false;

    try {
      // Start the context directly inside the user's click gesture. Some browsers
      // suspend it again while the microphone permission prompt is open.
      this.audioContext = new AudioContext({ latencyHint: 'interactive' });
      await this.audioContext.resume();

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });

      const audioTrack = this.stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.readyState !== 'live') {
        throw new Error('Der Mikrofonstream enthält keine aktive Audiospur.');
      }

      // Re-check after the permission dialog. Mobile browsers may suspend the
      // AudioContext while the browser-owned permission UI has focus.
      await this.ensureAudioContextRunning();

      const workletUrl = new URL('worklets/yin-processor.js', document.baseURI);
      await this.audioContext.audioWorklet.addModule(workletUrl);

      // Loading the worklet can also outlast the original user activation.
      await this.ensureAudioContextRunning();

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.worklet = new AudioWorkletNode(this.audioContext, 'saituno-yin', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers'
      });
      this.silentGain = this.audioContext.createGain();
      this.silentGain.gain.value = 0;

      this.worklet.port.onmessage = (event: MessageEvent<WorkletMeasurementMessage>) => {
        this.receivedWorkletMessage = true;
        this.clearStartupTimer();
        this.handleWorkletMessage(event.data);
      };
      this.worklet.onprocessorerror = () => {
        void this.handleProcessorError();
      };

      this.audioContext.onstatechange = () => {
        if (this.audioContext?.state === 'running' && this.stream?.active) {
          if (this._status() === 'suspended') {
            this._status.set('listening');
            this._errorMessage.set(null);
          }
        } else if (
          (this.audioContext?.state === 'suspended' ||
            (this.audioContext?.state as string) === 'interrupted') &&
          this._status() === 'listening'
        ) {
          this._status.set('suspended');
          this._errorMessage.set(
            'Die Audioverarbeitung wurde vom Browser pausiert. Tippe erneut auf Mikrofon aktivieren.'
          );
        }
      };

      this.source.connect(this.worklet);
      this.worklet.connect(this.silentGain);
      this.silentGain.connect(this.audioContext.destination);

      await this.ensureAudioContextRunning();
      this._status.set('listening');

      // Even a silent microphone produces worklet messages. If no message
      // arrives at all, the worklet graph is not processing the input stream.
      this.startupTimer = setTimeout(() => {
        if (!this.receivedWorkletMessage && this._status() === 'listening') {
          this._status.set('error');
          this._errorMessage.set(
            'Das Mikrofon wurde freigegeben, aber die Audioverarbeitung erhält keine Daten. Bitte lade die Seite neu und versuche es erneut.'
          );
          void this.releaseAudioResources();
        }
      }, 2500);
    } catch (error) {
      await this.releaseAudioResources();
      this._status.set(this.getErrorStatus(error));
      this._errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.startInProgress = false;
    }
  }

  async stop(): Promise<void> {
    await this.releaseAudioResources();
    this.recentFrequencies = [];
    this._measurement.set(null);
    this._errorMessage.set(null);
    this._status.set('idle');
  }

  ngOnDestroy(): void {
    void this.releaseAudioResources();
  }

  private async ensureAudioContextRunning(): Promise<void> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      throw new Error('Der AudioContext konnte nicht geöffnet werden.');
    }
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume();
    }
    if (this.audioContext.state !== 'running') {
      throw new Error('Der Browser hat die Audioverarbeitung nicht gestartet.');
    }
  }

  private clearStartupTimer(): void {
    if (this.startupTimer !== null) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
  }

  private async handleProcessorError(): Promise<void> {
    this._errorMessage.set('Die Audioverarbeitung wurde unerwartet beendet.');
    await this.releaseAudioResources();
    this._status.set('error');
  }

  private handleWorkletMessage(message: WorkletMeasurementMessage): void {
    if (message.type !== 'measurement' || !message.frequency || message.confidence < 0.65) {
      this._measurement.set(null);
      this.recentFrequencies = [];
      return;
    }

    this.recentFrequencies.push(message.frequency);
    if (this.recentFrequencies.length > 5) this.recentFrequencies.shift();
    const sorted = [...this.recentFrequencies].sort((a, b) => a - b);
    const frequency = sorted[Math.floor(sorted.length / 2)];
    const pitch = frequencyToPitch(frequency);
    if (!pitch) {
      this._measurement.set(null);
      return;
    }

    this._measurement.set({
      ...pitch,
      confidence: message.confidence,
      rms: message.rms
    });
  }

  private async releaseAudioResources(): Promise<void> {
    this.clearStartupTimer();
    if (this.worklet) {
      this.worklet.port.onmessage = null;
      this.worklet.disconnect();
      this.worklet = null;
    }
    this.source?.disconnect();
    this.source = null;
    this.silentGain?.disconnect();
    this.silentGain = null;

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    if (this.audioContext) {
      this.audioContext.onstatechange = null;
      if (this.audioContext.state !== 'closed') {
        await this.audioContext.close().catch(() => undefined);
      }
    }
    this.audioContext = null;
  }

  private getErrorStatus(error: unknown): AudioStatus {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'permission-denied';
    }
    if (
      error instanceof DOMException &&
      (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError')
    ) {
      return 'no-input';
    }
    return 'error';
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'Mikrofonzugriff wurde verweigert. Bitte erlaube den Zugriff in den Geräteeinstellungen.';
    }
    if (
      error instanceof DOMException &&
      (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError')
    ) {
      return 'Es wurde kein Mikrofon gefunden.';
    }
    if (error instanceof DOMException && error.name === 'NotReadableError') {
      return 'Das Mikrofon kann gerade nicht verwendet werden. Prüfe, ob eine andere App darauf zugreift.';
    }
    if (error instanceof Error && error.message) return error.message;
    return 'Die Audioverarbeitung konnte nicht gestartet werden. Bitte versuche es erneut.';
  }
}
