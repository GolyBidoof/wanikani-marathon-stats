import { describe, expect, it } from 'vitest';
import { formatNumber, localeForLanguage } from './numberFormat';

describe('localeForLanguage', () => {
  it('maps app languages to locale tags', () => {
    expect(localeForLanguage('en')).toBe('en-US');
    expect(localeForLanguage('ja')).toBe('ja-JP');
  });

  it('falls back to English for unknown or missing languages', () => {
    expect(localeForLanguage(undefined)).toBe('en-US');
    expect(localeForLanguage('de')).toBe('en-US');
  });
});

describe('formatNumber', () => {
  it('formats with the app language rather than the host locale', () => {
    // Regression guard: on a de-DE machine these used to render "2.000"/"1,5".
    expect(formatNumber(2000, 'en')).toBe('2,000');
    expect(formatNumber(2000, 'ja')).toBe('2,000');
    expect(formatNumber(2000)).toBe('2,000');
    expect(formatNumber(1.5, 'en')).toBe('1.5');
    expect(formatNumber(1.5, 'ja')).toBe('1.5');
  });

  it('keeps grouping for large counts in both languages', () => {
    expect(formatNumber(1355, 'en')).toBe('1,355');
    expect(formatNumber(1355, 'ja')).toBe('1,355');
  });
});
