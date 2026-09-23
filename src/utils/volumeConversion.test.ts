import { describe, expect, it } from 'vitest';
import {
  expandCombinedMetric,
  getEntryUnifiedVolume,
  getUnifiedVolume,
  isVolumeConversionActive,
  metricsOrderForConversion,
  migrateEnabledMetricsForConversion,
} from './volumeConversion';

describe('isVolumeConversionActive', () => {
  it('is only active for user views with valid config', () => {
    const config = { enabled: true, displayAs: 'chars' as const, charsPerPage: 500 };

    expect(isVolumeConversionActive(config, true)).toBe(true);
    expect(isVolumeConversionActive(config, false)).toBe(false);
    expect(isVolumeConversionActive({ ...config, enabled: false }, true)).toBe(false);
  });
});

describe('getUnifiedVolume', () => {
  it('combines pages into characters', () => {
    expect(getUnifiedVolume(10, 2000, 'chars', 500)).toBe(7000);
  });

  it('combines characters into pages', () => {
    expect(getUnifiedVolume(10, 2500, 'pages', 500)).toBe(15);
  });
});

describe('getEntryUnifiedVolume', () => {
  it('reads participant entry fields', () => {
    expect(
      getEntryUnifiedVolume(
        { user: 'test', pages: 2, characters: 1000 },
        { enabled: true, displayAs: 'chars', charsPerPage: 500 },
      ),
    ).toBe(2000);
  });
});

describe('metricsOrderForConversion', () => {
  it('keeps pages and chars and inserts combined after them', () => {
    expect(metricsOrderForConversion(['time', 'pages', 'chars', 'sources'], true)).toEqual([
      'time',
      'pages',
      'chars',
      'volume',
      'sources',
    ]);
  });

  it('removes combined when conversion is off', () => {
    expect(
      metricsOrderForConversion(['time', 'pages', 'chars', 'volume', 'sources'], false),
    ).toEqual(['time', 'pages', 'chars', 'sources']);
  });
});

describe('migrateEnabledMetricsForConversion', () => {
  it('hides pages and chars by default when enabling conversion', () => {
    const enabled = new Set(['time', 'pages', 'chars', 'sources']);
    const next = migrateEnabledMetricsForConversion(enabled, true);

    expect(next.has('volume')).toBe(true);
    expect(next.has('pages')).toBe(false);
    expect(next.has('chars')).toBe(false);
  });

  it('restores pages and chars when disabling conversion', () => {
    const enabled = new Set(['time', 'volume', 'sources']);
    const next = migrateEnabledMetricsForConversion(enabled, false);

    expect(next.has('volume')).toBe(false);
    expect(next.has('pages')).toBe(true);
    expect(next.has('chars')).toBe(true);
  });
});

describe('expandCombinedMetric', () => {
  it('leaves the list alone while the conversion applies', () => {
    expect(expandCombinedMetric(['avgTime', 'volume', 'sources'], true)).toEqual([
      'avgTime',
      'volume',
      'sources',
    ]);
  });

  it('falls back to the two totals it merges in the marathon-totals view', () => {
    expect(expandCombinedMetric(['avgTime', 'volume', 'sources'], false)).toEqual([
      'avgTime',
      'pages',
      'chars',
      'sources',
    ]);
  });

  it('does not duplicate totals that are already listed', () => {
    expect(expandCombinedMetric(['pages', 'volume', 'chars'], false)).toEqual(['pages', 'chars']);
  });

  it('keeps the marathon totals readable after the toggle strips the separate totals', () => {
    const stored = migrateEnabledMetricsForConversion(new Set(['pages', 'chars', 'sources']), true);
    expect(stored.has('volume')).toBe(true);
    expect(stored.has('pages')).toBe(false);

    const view = expandCombinedMetric(stored, false);
    expect(view).toContain('pages');
    expect(view).toContain('chars');
    expect(view).not.toContain('volume');
  });

  it('restores both totals in the order they were merged from', () => {
    const order = ['avgTime', 'volume', 'sources'];
    expect(expandCombinedMetric(order, false)).toEqual(['avgTime', 'pages', 'chars', 'sources']);
  });
});
