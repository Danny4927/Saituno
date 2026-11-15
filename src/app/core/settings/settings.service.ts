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

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value) this.restore(value);
    } catch {
      // The app can still run with in-memory defaults when storage is blocked.
    }
  }

  async load(): Promise<void> {
    // Browser settings are restored synchronously in the constructor. Only
    // native platforms need the asynchronous Preferences bridge.
    if (!Capacitor.isNativePlatform()) return;

    let value: string | null = null;
    try {
      value = (await Preferences.get({ key: STORAGE_KEY })).value;
    } catch {
      // Fall back to WebView localStorage when the native bridge is unavailable.
    }

    if (!value && typeof window !== 'undefined') {
      try {
        value = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        // Keep the in-memory defaults when both storage backends are unavailable.
      }
    }

    if (value) this.restore(value);
  }

  private restore(value: string): void {
    try {
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
      // Ignore corrupt values and keep the safe defaults.
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
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, value);
      }
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: STORAGE_KEY, value });
      }
    } catch {
      // Persistence is best-effort; current-session settings still work.
    }
  }
}
