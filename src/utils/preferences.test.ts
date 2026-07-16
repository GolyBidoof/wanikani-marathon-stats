import { describe, expect, it } from 'vitest';
import {
  getDefaultPreferences,
  loadPerUserMarathonPrefs,
  loadPreferences,
  savePerUserMarathonPrefs,
} from './preferences';

describe('loadPreferences', () => {
  it('returns defaults when storage is empty', () => {
    const prefs = loadPreferences();
    expect(prefs.appLanguage).toBe(getDefaultPreferences().appLanguage);
    expect(prefs.cardLanguage).toBe(prefs.appLanguage);
    expect(prefs.enabledMetrics).toContain('time');
  });

  it('falls back to defaults for invalid stored data', () => {
    localStorage.setItem('wk-marathon-prefs-v1', '{"cardLanguage":"klingon"}');
    const prefs = loadPreferences();
    expect(prefs.cardLanguage).toBe(getDefaultPreferences().cardLanguage);
    expect(prefs.appLanguage).toBe(getDefaultPreferences().appLanguage);
  });

  it('preserves saved card language when app language is missing', () => {
    localStorage.setItem(
      'wk-marathon-prefs-v1',
      JSON.stringify({ cardLanguage: 'ja', enabledMetrics: ['time'] }),
    );
    const prefs = loadPreferences();
    expect(prefs.cardLanguage).toBe('ja');
    expect(prefs.appLanguage).toBe(getDefaultPreferences().appLanguage);
  });
});

describe('per-user marathon prefs', () => {
  it('round-trips excluded marathons and order', () => {
    savePerUserMarathonPrefs('Alice', {
      excludedMarathons: ['Winter 2025'],
      userMarathonsOrder: ['Summer 2025', 'Winter 2025'],
    });

    expect(loadPerUserMarathonPrefs('Alice')).toEqual({
      excludedMarathons: ['Winter 2025'],
      userMarathonsOrder: ['Summer 2025', 'Winter 2025'],
    });
  });
});
