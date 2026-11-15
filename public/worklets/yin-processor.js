/**
 * YIN pitch estimation shared by the AudioWorklet and Vitest.
 * The worklet feeds this function a 4:1 box-filtered mono signal.
 */

/**
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @param {{ minFrequency?: number, maxFrequency?: number, threshold?: number, minRms?: number }} [options]
 * @returns {{ frequency: number, confidence: number, rms: number } | null}
 */
export function estimatePitch(samples, sampleRate, options = {}) {
  const minFrequency = options.minFrequency ?? 25;
  const maxFrequency = options.maxFrequency ?? 1500;
  const threshold = options.threshold ?? 0.15;
  const minRms = options.minRms ?? 0.004;

  if (!samples || samples.length < 512 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return null;
  }

  let energy = 0;
  for (let i = 0; i < samples.length; i += 1) {
    energy += samples[i] * samples[i];
  }
  const rms = Math.sqrt(energy / samples.length);
  if (!Number.isFinite(rms) || rms < minRms) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(samples.length / 2));
  if (maxTau <= minTau + 1) return null;

  const differences = new Float64Array(maxTau + 1);
  const normalized = new Float64Array(maxTau + 1);
  const comparisonLength = samples.length - maxTau;

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let difference = 0;
    for (let i = 0; i < comparisonLength; i += 1) {
      const delta = samples[i] - samples[i + tau];
      difference += delta * delta;
    }
    differences[tau] = difference;
  }

  normalized[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += differences[tau];
    normalized[tau] = runningSum > 0 ? (differences[tau] * tau) / runningSum : 1;
  }

  let selectedTau = -1;
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (normalized[tau] < threshold) {
      while (tau < maxTau && normalized[tau + 1] < normalized[tau]) tau += 1;
      selectedTau = tau;
      break;
    }
  }

  if (selectedTau < 0) {
    let bestValue = Number.POSITIVE_INFINITY;
    for (let tau = minTau; tau <= maxTau; tau += 1) {
      if (normalized[tau] < bestValue) {
        bestValue = normalized[tau];
        selectedTau = tau;
      }
    }
    if (selectedTau < 0 || bestValue > 0.35) return null;
  }

  const left = normalized[selectedTau - 1] ?? normalized[selectedTau];
  const center = normalized[selectedTau];
  const right = normalized[selectedTau + 1] ?? center;
  const denominator = left - 2 * center + right;
  const correction =
    Math.abs(denominator) > 1e-12 ? 0.5 * (left - right) / denominator : 0;
  const refinedTau = selectedTau + Math.max(-1, Math.min(1, correction));
  const frequency = sampleRate / refinedTau;
  const confidence = Math.max(0, Math.min(1, 1 - center));

  if (
    !Number.isFinite(frequency) ||
    frequency < minFrequency ||
    frequency > maxFrequency ||
    confidence < 0.65
  ) {
    return null;
  }

  return { frequency, confidence, rms };
}

const DECIMATION = 4;
const WINDOW_SIZE = 2048;
const HOP_SIZE = 512;

if (typeof AudioWorkletProcessor !== 'undefined') {
  class SaitunoYinProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.buffer = new Float32Array(WINDOW_SIZE);
      this.writeIndex = 0;
      this.samplesSinceAnalysis = 0;
      this.decimationCount = 0;
      this.decimationSum = 0;
      this.effectiveSampleRate = sampleRate / DECIMATION;
    }

    process(inputs) {
      const channels = inputs[0];
      if (!channels || channels.length === 0 || channels[0].length === 0) return true;

      const frameLength = channels[0].length;
      for (let i = 0; i < frameLength; i += 1) {
        let mono = 0;
        for (let channel = 0; channel < channels.length; channel += 1) {
          mono += channels[channel][i] ?? 0;
        }
        mono /= channels.length;
        this.decimationSum += mono;
        this.decimationCount += 1;

        if (this.decimationCount === DECIMATION) {
          this.buffer[this.writeIndex] = this.decimationSum / DECIMATION;
          this.writeIndex = (this.writeIndex + 1) % WINDOW_SIZE;
          this.samplesSinceAnalysis += 1;
          this.decimationCount = 0;
          this.decimationSum = 0;

          if (
            this.writeIndex === 0 ||
            this.samplesSinceAnalysis >= HOP_SIZE
          ) {
            this.samplesSinceAnalysis = 0;
            const ordered = new Float32Array(WINDOW_SIZE);
            const firstPart = WINDOW_SIZE - this.writeIndex;
            ordered.set(this.buffer.subarray(this.writeIndex), 0);
            ordered.set(this.buffer.subarray(0, this.writeIndex), firstPart);
            const result = estimatePitch(ordered, this.effectiveSampleRate);
            this.port.postMessage({
              type: 'measurement',
              frequency: result?.frequency ?? null,
              confidence: result?.confidence ?? 0,
              rms: result?.rms ?? 0
            });
          }
        }
      }
      return true;
    }
  }

  registerProcessor('saituno-yin', SaitunoYinProcessor);
}
