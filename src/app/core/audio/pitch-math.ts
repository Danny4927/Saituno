const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

export function frequencyToPitch(
  frequency: number,
  referenceFrequency = 440
): Omit<import('./audio.models').PitchMeasurement, 'confidence' | 'rms'> | null {
  if (
    !Number.isFinite(frequency) ||
    frequency <= 0 ||
    !Number.isFinite(referenceFrequency) ||
    referenceFrequency <= 0
  ) {
    return null;
  }

  const exactMidi = 69 + 12 * Math.log2(frequency / referenceFrequency);
  const midiNote = Math.round(exactMidi);
  const cents = (exactMidi - midiNote) * 100;
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const targetFrequency = referenceFrequency * 2 ** ((midiNote - 69) / 12);

  return {
    frequency,
    note: NOTE_NAMES[noteIndex],
    octave,
    midiNote,
    targetFrequency,
    cents
  };
}
