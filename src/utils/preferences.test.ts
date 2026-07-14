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
    expect(prefs.cardLanguage).toBe('en');
    expect(prefs.enabledMetrics).toContain('time');
  });

  it('falls back to defaults for invalid stored data', () => {
    localStorage.setItem('wk-marathon-prefs-v1', '{"cardLanguage":"klingon"}');
    const prefs = loadPreferences();
    expect(prefs.cardLanguage).toBe(getDefaultPreferences().cardLanguage);
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
