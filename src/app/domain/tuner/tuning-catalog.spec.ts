import { describe, expect, it } from 'vitest';
import {
  centsFromTarget,
  closestString,
  getInstrument,
  getTuning,
  INSTRUMENTS,
  midiToFrequency
} from './tuning-catalog';

describe('instrument and tuning catalog', () => {
  it('provides all MVP instruments', () => {
    expect(INSTRUMENTS.map(({ id }) => id)).toEqual(['guitar', 'ukulele', 'bass']);
  });

  it('contains all planned guitar tunings', () => {
    expect(getInstrument('guitar')?.tunings.map(({ id }) => id)).toEqual([
      'guitar-standard', 'guitar-drop-d', 'guitar-eb-standard', 'guitar-d-standard'
    ]);
  });

  it('defines high-G and low-G ukulele tunings', () => {
    expect(getTuning('ukulele', 'ukulele-high-g')?.strings.map(({ id }) => id)).toEqual([
      'G4', 'C4', 'E4', 'A4'
    ]);
    expect(getTuning('ukulele', 'ukulele-low-g')?.strings[0].midi).toBe(55);
  });

  it('contains four-, five- and six-string bass plus BEAD and Drop D', () => {
    const bass = getInstrument('bass');
    expect(bass?.tunings.map(({ id }) => id)).toEqual([
      'bass-4-standard', 'bass-5-standard', 'bass-6-standard', 'bass-bead', 'bass-drop-d'
    ]);
    expect(getTuning('bass', 'bass-5-standard')?.strings).toHaveLength(5);
    expect(getTuning('bass', 'bass-6-standard')?.strings).toHaveLength(6);
    expect(getTuning('bass', 'bass-6-standard')?.strings[0].frequency).toBeCloseTo(30.8677, 3);
  });

  it('calculates equal-tempered frequencies from MIDI note numbers', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(40)).toBeCloseTo(82.4069, 3);
  });

  it('finds the closest string within the selected tuning', () => {
    const dropD = getTuning('guitar', 'guitar-drop-d')!;
    expect(closestString(73.416, dropD.strings)?.id).toBe('D2');
    expect(closestString(110, dropD.strings)?.id).toBe('A2');
    expect(closestString(0, dropD.strings)).toBeNull();
  });

  it('calculates cents and rejects invalid frequencies', () => {
    expect(centsFromTarget(440 * 2 ** (12 / 1200), 440)).toBeCloseTo(12, 5);
    expect(centsFromTarget(0, 440)).toBeNull();
    expect(centsFromTarget(440, Number.NaN)).toBeNull();
  });
});
