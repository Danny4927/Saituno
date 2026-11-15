import { describe, expect, it } from 'vitest';
import { estimatePitch } from '../../../../public/worklets/yin-processor.js';

function sineWave(
  frequency: number,
  sampleRate = 12_000,
  length = 4096,
  amplitude = 0.5
): Float32Array {
  return Float32Array.from(
    { length },
    (_, index) => amplitude * Math.sin((2 * Math.PI * frequency * index) / sampleRate)
  );
}

function harmonicSignal(
  fundamental: number,
  sampleRate = 12_000,
  length = 4096
): Float32Array {
  return Float32Array.from({ length }, (_, index) => {
    const phase = (2 * Math.PI * fundamental * index) / sampleRate;
    return 0.12 * Math.sin(phase) + 0.65 * Math.sin(2 * phase) + 0.2 * Math.sin(3 * phase);
  });
}

describe('YIN pitch estimation', () => {
  it.each([30.8677, 41.2034, 55, 82.4069, 110, 220, 329.6276, 440, 659.2551, 1000, 1500])(
    'detects a %s Hz sine wave',
    (frequency) => {
      const result = estimatePitch(sineWave(frequency), 12_000);
      expect(result).not.toBeNull();
      expect(result!.frequency).toBeCloseTo(frequency, 0);
      expect(result!.confidence).toBeGreaterThan(0.8);
    }
  );

  it.each([11_025, 12_000, 16_000])('supports a %s Hz sample rate', (sampleRate) => {
    const result = estimatePitch(sineWave(440, sampleRate), sampleRate);
    expect(result?.frequency).toBeCloseTo(440, 0);
  });

  it('detects the fundamental when the second harmonic is stronger', () => {
    const result = estimatePitch(harmonicSignal(110), 12_000);
    expect(result).not.toBeNull();
    expect(result!.frequency).toBeCloseTo(110, 0);
  });

  it('tolerates low-level deterministic background noise', () => {
    const signal = sineWave(220);
    for (let i = 0; i < signal.length; i += 1) {
      signal[i] += 0.025 * Math.sin(i * 12.9898) * Math.cos(i * 78.233);
    }
    const result = estimatePitch(signal, 12_000);
    expect(result).not.toBeNull();
    expect(result!.frequency).toBeCloseTo(220, 0);
  });

  it('rejects silence and signals below the minimum RMS', () => {
    expect(estimatePitch(new Float32Array(4096), 12_000)).toBeNull();
    expect(estimatePitch(new Float32Array(4096).fill(0.001), 12_000)).toBeNull();
  });

  it('rejects invalid sample rates and too-short buffers', () => {
    expect(estimatePitch(new Float32Array(100), 12_000)).toBeNull();
    expect(estimatePitch(sineWave(440), 0)).toBeNull();
  });

  it('rejects frequencies below the supported bass range', () => {
    expect(estimatePitch(sineWave(20), 12_000)).toBeNull();
  });
});
