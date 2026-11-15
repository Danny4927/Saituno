import { describe, expect, it } from 'vitest';
import { centsFromTarget, closestGuitarString, GUITAR_STANDARD } from './guitar-standard';

describe('guitar standard tuning helpers', () => {
  it('defines six strings from low E2 to high E4', () => {
    expect(GUITAR_STANDARD.map((string) => string.id)).toEqual([
      'E2',
      'A2',
      'D3',
      'G3',
      'B3',
      'E4'
    ]);
  });

  it.each([
    [82.4069, 'E2'],
    [110, 'A2'],
    [146.8324, 'D3'],
    [195.9977, 'G3'],
    [246.9417, 'B3'],
    [329.6276, 'E4']
  ])('detects the closest string for %s Hz', (frequency, expected) => {
    expect(closestGuitarString(frequency)?.id).toBe(expected);
  });

  it('calculates cents relative to a selected string', () => {
    expect(centsFromTarget(440 * 2 ** (12 / 1200), 440)).toBeCloseTo(12, 5);
    expect(centsFromTarget(440 * 2 ** (-8 / 1200), 440)).toBeCloseTo(-8, 5);
  });

  it('rejects invalid frequencies', () => {
    expect(closestGuitarString(0)).toBeNull();
    expect(centsFromTarget(Number.NaN, 440)).toBeNull();
  });
});
