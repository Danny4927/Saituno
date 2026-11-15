import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioService } from './audio.service';

class FakeAudioContext {
  readonly state = 'running';
  readonly resume = vi.fn().mockResolvedValue(undefined);
  readonly close = vi.fn().mockResolvedValue(undefined);
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

  it('maps a missing microphone to a dedicated state', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Missing', 'NotFoundError'));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('AudioContext', class {});
    vi.stubGlobal('AudioWorkletNode', class {});

    const service = new AudioService();
    await service.start();

    expect(service.status()).toBe('no-input');
    expect(service.errorMessage()).toContain('kein Mikrofon');
  });
});
