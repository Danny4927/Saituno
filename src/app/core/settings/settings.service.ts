import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { getInstrument, getTuning } from '../../domain/tuner/tuning-catalog';

export interface AppSettings {
  readonly instrumentId: string;
  readonly tuningId: string;
  readonly selectionMode: 'auto' | 'manual';
  readonly manualStringId: string | null;
}

const STORAGE_KEY = 'saituno.settings.v1';

export const DEFAULT_SETTINGS: AppSettings = {
  instrumentId: 'guitar',
  tuningId: 'guitar-standard',
  selectionMode: 'auto',
  manualStringId: 'E2'
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _settings = signal<AppSettings>(DEFAULT_SETTINGS);
  readonly settings = this._settings.asReadonly();

  async load(): Promise<void> {
    try {
      const value = Capacitor.isNativePlatform()
        ? (await Preferences.get({ key: STORAGE_KEY })).value
        : typeof window !== 'undefined'
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (!value) return;

      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object') return;
      const candidate = parsed as Partial<AppSettings>;
      const instrument = getInstrument(candidate.instrumentId ?? '');
      if (!instrument) return;

      const tuning = getTuning(instrument.id, candidate.tuningId ?? '');
      if (!tuning) return;

      const selectionMode = candidate.selectionMode === 'manual' ? 'manual' : 'auto';
      const manualStringId =
        typeof candidate.manualStringId === 'string' &&
        tuning.strings.some((string) => string.id === candidate.manualStringId)
          ? candidate.manualStringId
          : (tuning.strings[0]?.id ?? null);

      this._settings.set({
        instrumentId: instrument.id,
        tuningId: tuning.id,
        selectionMode,
        manualStringId
      });
    } catch {
      // Storage can be unavailable in private browsing or a restricted WebView.
      // Keep the safe defaults and let the tuner remain usable.
      this._settings.set(DEFAULT_SETTINGS);
    }
  }

  async update(partial: Partial<AppSettings>): Promise<void> {
    const current = this._settings();
    const next = { ...current, ...partial };
    const instrument = getInstrument(next.instrumentId);
    if (!instrument) return;

    const tuning = getTuning(instrument.id, next.tuningId);
    if (!tuning) return;

    const manualStringId =
      next.manualStringId && tuning.strings.some((string) => string.id === next.manualStringId)
        ? next.manualStringId
        : (tuning.strings[0]?.id ?? null);

    const validated: AppSettings = {
      instrumentId: instrument.id,
      tuningId: tuning.id,
      selectionMode: next.selectionMode === 'manual' ? 'manual' : 'auto',
      manualStringId
    };

    this._settings.set(validated);
    try {
      const value = JSON.stringify(validated);
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: STORAGE_KEY, value });
      } else if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {
      // Persistence is best-effort; current-session settings still work.
    }
  }
}
