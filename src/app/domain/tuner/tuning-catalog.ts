export interface TuningString {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  readonly octave: number;
  readonly midi: number;
  readonly frequency: number;
}

export interface TuningPreset {
  readonly id: string;
  readonly name: string;
  readonly strings: readonly TuningString[];
}

export interface InstrumentDefinition {
  readonly id: string;
  readonly name: string;
  readonly defaultTuningId: string;
  readonly tunings: readonly TuningPreset[];
}

type StringDefinition = readonly [label: string, note: string, octave: number, midi: number];

export function midiToFrequency(midi: number, referenceFrequency = 440): number {
  if (!Number.isFinite(midi) || !Number.isFinite(referenceFrequency) || referenceFrequency <= 0) {
    return Number.NaN;
  }
  return referenceFrequency * 2 ** ((midi - 69) / 12);
}

function tuning(id: string, name: string, definitions: readonly StringDefinition[]): TuningPreset {
  return {
    id,
    name,
    strings: definitions.map(([label, note, octave, midi]) => ({
      id: `${note}${octave}`,
      label,
      note,
      octave,
      midi,
      frequency: midiToFrequency(midi)
    }))
  };
}

const GUITAR_TUNINGS: readonly TuningPreset[] = [
  tuning('guitar-standard', 'E Standard', [
    ['6', 'E', 2, 40],
    ['5', 'A', 2, 45],
    ['4', 'D', 3, 50],
    ['3', 'G', 3, 55],
    ['2', 'B', 3, 59],
    ['1', 'E', 4, 64]
  ]),
  tuning('guitar-drop-d', 'Drop D', [
    ['6', 'D', 2, 38],
    ['5', 'A', 2, 45],
    ['4', 'D', 3, 50],
    ['3', 'G', 3, 55],
    ['2', 'B', 3, 59],
    ['1', 'E', 4, 64]
  ]),
  tuning('guitar-eb-standard', 'Eb Standard', [
    ['6', 'Eb', 2, 39],
    ['5', 'Ab', 2, 44],
    ['4', 'Db', 3, 49],
    ['3', 'Gb', 3, 54],
    ['2', 'Bb', 3, 58],
    ['1', 'Eb', 4, 63]
  ]),
  tuning('guitar-d-standard', 'D Standard', [
    ['6', 'D', 2, 38],
    ['5', 'G', 2, 43],
    ['4', 'C', 3, 48],
    ['3', 'F', 3, 53],
    ['2', 'A', 3, 57],
    ['1', 'D', 4, 62]
  ])
];

const UKULELE_TUNINGS: readonly TuningPreset[] = [
  tuning('ukulele-high-g', 'Standard (High G)', [
    ['4', 'G', 4, 67],
    ['3', 'C', 4, 60],
    ['2', 'E', 4, 64],
    ['1', 'A', 4, 69]
  ]),
  tuning('ukulele-low-g', 'Low G', [
    ['4', 'G', 3, 55],
    ['3', 'C', 4, 60],
    ['2', 'E', 4, 64],
    ['1', 'A', 4, 69]
  ])
];

const BASS_TUNINGS: readonly TuningPreset[] = [
  tuning('bass-4-standard', '4-Saiter Standard', [
    ['4', 'E', 1, 28],
    ['3', 'A', 1, 33],
    ['2', 'D', 2, 38],
    ['1', 'G', 2, 43]
  ]),
  tuning('bass-5-standard', '5-Saiter Standard', [
    ['5', 'B', 0, 23],
    ['4', 'E', 1, 28],
    ['3', 'A', 1, 33],
    ['2', 'D', 2, 38],
    ['1', 'G', 2, 43]
  ]),
  tuning('bass-6-standard', '6-Saiter Standard', [
    ['6', 'B', 0, 23],
    ['5', 'E', 1, 28],
    ['4', 'A', 1, 33],
    ['3', 'D', 2, 38],
    ['2', 'G', 2, 43],
    ['1', 'C', 3, 48]
  ]),
  tuning('bass-bead', 'BEAD', [
    ['4', 'B', 0, 23],
    ['3', 'E', 1, 28],
    ['2', 'A', 1, 33],
    ['1', 'D', 2, 38]
  ]),
  tuning('bass-drop-d', 'Drop D', [
    ['4', 'D', 1, 26],
    ['3', 'A', 1, 33],
    ['2', 'D', 2, 38],
    ['1', 'G', 2, 43]
  ])
];

export const INSTRUMENTS: readonly InstrumentDefinition[] = [
  { id: 'guitar', name: 'Gitarre', defaultTuningId: 'guitar-standard', tunings: GUITAR_TUNINGS },
  { id: 'ukulele', name: 'Ukulele', defaultTuningId: 'ukulele-high-g', tunings: UKULELE_TUNINGS },
  { id: 'bass', name: 'Bass', defaultTuningId: 'bass-4-standard', tunings: BASS_TUNINGS }
];

export function getInstrument(instrumentId: string): InstrumentDefinition | null {
  return INSTRUMENTS.find((instrument) => instrument.id === instrumentId) ?? null;
}

export function getTuning(instrumentId: string, tuningId: string): TuningPreset | null {
  return getInstrument(instrumentId)?.tunings.find((preset) => preset.id === tuningId) ?? null;
}

export function centsFromTarget(frequency: number, targetFrequency: number): number | null {
  if (
    !Number.isFinite(frequency) ||
    frequency <= 0 ||
    !Number.isFinite(targetFrequency) ||
    targetFrequency <= 0
  ) {
    return null;
  }
  return 1200 * Math.log2(frequency / targetFrequency);
}

export function closestString(
  frequency: number,
  strings: readonly TuningString[]
): TuningString | null {
  if (!Number.isFinite(frequency) || frequency <= 0 || strings.length === 0) return null;
  return strings.reduce<TuningString | null>((closest, candidate) => {
    if (!closest) return candidate;
    const candidateDistance = Math.abs(centsFromTarget(frequency, candidate.frequency) ?? Infinity);
    const closestDistance = Math.abs(centsFromTarget(frequency, closest.frequency) ?? Infinity);
    return candidateDistance < closestDistance ? candidate : closest;
  }, null);
}
