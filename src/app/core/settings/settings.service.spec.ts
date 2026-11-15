import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { DEFAULT_SETTINGS, SettingsService } from './settings.service';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

describe('SettingsService', () => {
  beforeEach(() => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    vi.clearAllMocks();
    vi.mocked(Preferences.get).mockResolvedValue({ value: null });
    vi.mocked(Preferences.set).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts with safe defaults when no saved settings exist', async () => {
    const service = new SettingsService();
    await service.load();

    expect(service.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('restores a saved instrument, tuning and manual string', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({
        instrumentId: 'bass',
        tuningId: 'bass-5-standard',
        selectionMode: 'manual',
        manualStringId: 'B0'
      })
    });

    const service = new SettingsService();
    await service.load();

    expect(service.settings()).toEqual({
      instrumentId: 'bass',
      tuningId: 'bass-5-standard',
      selectionMode: 'manual',
      manualStringId: 'B0'
    });
  });

  it('falls back to defaults when persisted values are invalid', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({
        instrumentId: 'unknown',
        tuningId: 'invalid',
        selectionMode: 'manual',
        manualStringId: 'invalid'
      })
    });

    const service = new SettingsService();
    await service.load();

    expect(service.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('persists validated changes and corrects a string invalid for the new tuning', async () => {
    const service = new SettingsService();
    await service.update({
      instrumentId: 'ukulele',
      tuningId: 'ukulele-low-g',
      selectionMode: 'manual',
      manualStringId: 'E2'
    });

    expect(service.settings()).toEqual({
      instrumentId: 'ukulele',
      tuningId: 'ukulele-low-g',
      selectionMode: 'manual',
      manualStringId: 'G3'
    });
    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'saituno.settings.v1',
      value: JSON.stringify(service.settings())
    });
  });

  it('keeps the app usable if storage is unavailable', async () => {
    vi.mocked(Preferences.get).mockRejectedValue(new Error('storage unavailable'));
    const service = new SettingsService();

    await expect(service.load()).resolves.toBeUndefined();
    expect(service.settings()).toEqual(DEFAULT_SETTINGS);
  });
  it('uses browser localStorage on the web instead of the native Preferences bridge', async () => {
    const values = new Map<string, string>();
    const localStorage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value))
    };
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.stubGlobal('window', { localStorage });

    const service = new SettingsService();
    await service.update({
      instrumentId: 'bass',
      tuningId: 'bass-5-standard',
      selectionMode: 'manual',
      manualStringId: 'B0'
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'saituno.settings.v1',
      JSON.stringify(service.settings())
    );
    expect(Preferences.set).not.toHaveBeenCalled();

    const restored = new SettingsService();
    await restored.load();
    expect(restored.settings()).toEqual(service.settings());
  });

});
