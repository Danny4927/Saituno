import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioService } from './audio.service';

class FakeAudioContext {
  static latest: FakeAudioContext | null = null;
  state = 'suspended';
  onstatechange: (() => void) | null = null;
  readonly destination = {};
  readonly audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
  readonly source = { connect: vi.fn(), disconnect: vi.fn() };
  readonly gainNode = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  readonly resume = vi.fn().mockImplementation(async () => {
    this.state = 'running';
  });
  readonly close = vi.fn().mockImplementation(async () => {
    this.state = 'closed';
  });
  readonly createMediaStreamSource = vi.fn(() => this.source);
  readonly createGain = vi.fn(() => this.gainNode);

  constructor() {
    FakeAudioContext.latest = this;
  }
}

class FakeAudioWorkletNode {
  readonly port = { onmessage: null as ((event: MessageEvent) => void) | null };
  onprocessorerror: (() => void) | null = null;
  readonly connect = vi.fn();
  readonly disconnect = vi.fn();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AudioService', () => {
  it('reports unsupported when browser audio APIs are unavailable', async () => {
    vi.stubGlobal('navigator', { mediaDevices: undefined });
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('AudioWorkletNode', undefined);

    const service = new AudioService();
    await service.start();

    expect(service.status()).toBe('unsupported');
    expect(service.errorMessage()).toContain('unterstützt');
  });

  it('maps microphone permission denial to a dedicated state', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('AudioWorkletNode', class {});

    const service = new AudioService();
    await service.start();

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(service.status()).toBe('permission-denied');
    expect(service.errorMessage()).toContain('verweigert');
  });

  it('releases microphone tracks and audio nodes when stopped', async () => {
    const stopTrack = vi.fn();
    const audioTrack = { readyState: 'live' as MediaStreamTrackState, stop: stopTrack };
    const getUserMedia = vi.fn().mockResolvedValue({
      active: true,
      getAudioTracks: () => [audioTrack],
      getTracks: () => [audioTrack]
    });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('document', {
      baseURI: 'https://saituno.test/',
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('AudioWorkletNode', FakeAudioWorkletNode);

    const service = new AudioService();
    await service.start();

    expect(service.status()).toBe('listening');
    await service.stop();

    expect(stopTrack).toHaveBeenCalledOnce();
    expect(service.status()).toBe('idle');
    expect(service.measurement()).toBeNull();
  });

  it('maps a missing microphone to a dedicated state', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Missing', 'NotFoundError'));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('AudioWorkletNode', class {});

    const service = new AudioService();
    await service.start();

    expect(service.status()).toBe('no-input');
    expect(service.errorMessage()).toContain('kein Mikrofon');
  });

  it('resumes the AudioContext again after the microphone permission prompt', async () => {
    const audioTrack = { readyState: 'live' as MediaStreamTrackState, stop: vi.fn() };
    const getUserMedia = vi.fn().mockImplementation(async () => {
      // Simulate browsers suspending audio while their permission UI is open.
      FakeAudioContext.latest!.state = 'suspended';
      return { active: true, getAudioTracks: () => [audioTrack], getTracks: () => [audioTrack] };
    });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('document', {
      baseURI: 'https://saituno.test/',
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('AudioWorkletNode', FakeAudioWorkletNode);

    const service = new AudioService();
    await service.start();

    expect(FakeAudioContext.latest!.resume).toHaveBeenCalledTimes(2);
    expect(service.status()).toBe('listening');
    await service.stop();
  });
  it('stops the microphone when the document enters the background', async () => {
    const stopTrack = vi.fn();
    const audioTrack = { readyState: 'live' as MediaStreamTrackState, stop: stopTrack };
    const getUserMedia = vi.fn().mockResolvedValue({
      active: true,
      getAudioTracks: () => [audioTrack],
      getTracks: () => [audioTrack]
    });
    let visibilityHandler: (() => void) | undefined;
    const fakeDocument = {
      baseURI: 'https://saituno.test/',
      visibilityState: 'visible',
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'visibilitychange') visibilityHandler = handler;
      }),
      removeEventListener: vi.fn()
    };
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('document', fakeDocument);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('AudioWorkletNode', FakeAudioWorkletNode);

    const service = new AudioService();
    await service.start();
    expect(service.status()).toBe('listening');

    fakeDocument.visibilityState = 'hidden';
    visibilityHandler?.();
    await vi.waitFor(() => expect(service.status()).toBe('paused'));

    expect(stopTrack).toHaveBeenCalledOnce();
    expect(service.errorMessage()).toContain('Hintergrund');
    expect(FakeAudioContext.latest!.state).toBe('closed');
  });
});
