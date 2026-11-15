import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioService } from './audio.service';

class FakeAudioContext {
  state = 'running';
  readonly destination = {};
  readonly audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
  readonly source = { connect: vi.fn(), disconnect: vi.fn() };
  readonly gainNode = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  readonly resume = vi.fn().mockResolvedValue(undefined);
  readonly close = vi.fn().mockImplementation(async () => {
    this.state = 'closed';
  });
  readonly createMediaStreamSource = vi.fn(() => this.source);
  readonly createGain = vi.fn(() => this.gainNode);
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
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }]
    });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('document', { baseURI: 'https://saituno.test/' });
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
});
