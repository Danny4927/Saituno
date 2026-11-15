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

    try {
      // Create and resume the context synchronously from the user's gesture
      // before awaiting the browser's microphone permission prompt.
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

      await this.audioContext.audioWorklet.addModule(
        new URL('worklets/yin-processor.js', document.baseURI)
      );

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
        this.handleWorkletMessage(event.data);
      };
      this.worklet.onprocessorerror = () => {
        void this.handleProcessorError();
      };

      this.source.connect(this.worklet);
      this.worklet.connect(this.silentGain);
      this.silentGain.connect(this.audioContext.destination);
      this._status.set('listening');
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

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close().catch(() => undefined);
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
    return 'Die Audioverarbeitung konnte nicht gestartet werden. Bitte versuche es erneut.';
  }
}
