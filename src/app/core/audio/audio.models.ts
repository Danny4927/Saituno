export type AudioStatus =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'suspended'
  | 'paused'
  | 'unsupported'
  | 'permission-denied'
  | 'no-input'
  | 'error';

export interface PitchMeasurement {
  readonly frequency: number;
  readonly confidence: number;
  readonly rms: number;
  readonly note: string;
  readonly octave: number;
  readonly midiNote: number;
  readonly targetFrequency: number;
  readonly cents: number;
}

export interface WorkletMeasurementMessage {
  readonly type: 'measurement';
  readonly frequency: number | null;
  readonly confidence: number;
  readonly rms: number;
}
