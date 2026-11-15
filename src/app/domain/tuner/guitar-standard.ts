import {
  centsFromTarget,
  closestString,
  INSTRUMENTS,
  type TuningString
} from './tuning-catalog';

export type { TuningString } from './tuning-catalog';

/** Backwards-compatible export for the original Phase 3 guitar preset. */
export const GUITAR_STANDARD = INSTRUMENTS.find((instrument) => instrument.id === 'guitar')!
  .tunings.find((tuning) => tuning.id === 'guitar-standard')!.strings;

export { centsFromTarget };

export function closestGuitarString(frequency: number): TuningString | null {
  return closestString(frequency, GUITAR_STANDARD);
}
