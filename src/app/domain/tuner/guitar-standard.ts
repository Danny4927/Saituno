export interface TuningString {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  readonly octave: number;
  readonly midi: number;
  readonly frequency: number;
}

/** Standard six-string guitar, ordered from the lowest (thickest) string. */
export const GUITAR_STANDARD: readonly TuningString[] = [
  { id: 'E2', label: '6', note: 'E', octave: 2, midi: 40, frequency: 82.4069 },
  { id: 'A2', label: '5', note: 'A', octave: 2, midi: 45, frequency: 110 },
  { id: 'D3', label: '4', note: 'D', octave: 3, midi: 50, frequency: 146.8324 },
  { id: 'G3', label: '3', note: 'G', octave: 3, midi: 55, frequency: 195.9977 },
  { id: 'B3', label: '2', note: 'B', octave: 3, midi: 59, frequency: 246.9417 },
  { id: 'E4', label: '1', note: 'E', octave: 4, midi: 64, frequency: 329.6276 }
] as const;

export function centsFromTarget(frequency: number, targetFrequency: number): number | null {
  if (
    !Number.isFinite(frequency) ||
    frequency <= 0 ||
    !Number.isFinite(targetFrequency) ||
    targetFrequency <= 0
  )
    return null;
  return 1200 * Math.log2(frequency / targetFrequency);
}

export function closestGuitarString(frequency: number): TuningString | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  return GUITAR_STANDARD.reduce((closest, candidate) => {
    const candidateDistance = Math.abs(centsFromTarget(frequency, candidate.frequency) ?? Infinity);
    const closestDistance = Math.abs(centsFromTarget(frequency, closest.frequency) ?? Infinity);
    return candidateDistance < closestDistance ? candidate : closest;
  });
}
