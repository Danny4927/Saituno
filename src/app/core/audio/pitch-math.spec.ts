import { describe, expect, it } from 'vitest';
import { frequencyToPitch } from './pitch-math';

describe('frequencyToPitch', () => {
  it.each([
    [41.2034, 'E', 1],
    [55, 'A', 1],
    [82.4069, 'E', 2],
    [110, 'A', 2],
    [220, 'A', 3],
    [329.6276, 'E', 4],
    [440, 'A', 4],
    [659.2551, 'E', 5]
  ])('maps %s Hz to %s%s', (frequency, note, octave) => {
    const result = frequencyToPitch(frequency);
    expect(result?.note).toBe(note);
    expect(result?.octave).toBe(octave);
    expect(result?.cents).toBeCloseTo(0, 0);
  });

  it('calculates cent deviation around A4', () => {
    const sharp = frequencyToPitch(440 * 2 ** (10 / 1200));
    const flat = frequencyToPitch(440 * 2 ** (-25 / 1200));
    expect(sharp?.cents).toBeCloseTo(10, 4);
    expect(flat?.cents).toBeCloseTo(-25, 4);
  });

  it('supports a custom reference frequency', () => {
    expect(frequencyToPitch(442, 442)?.cents).toBeCloseTo(0, 8);
  });

  it('rejects invalid frequencies', () => {
    expect(frequencyToPitch(0)).toBeNull();
    expect(frequencyToPitch(Number.NaN)).toBeNull();
    expect(frequencyToPitch(440, 0)).toBeNull();
  });
});
