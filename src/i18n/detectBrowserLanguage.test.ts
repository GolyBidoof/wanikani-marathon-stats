import { describe, expect, it } from 'vitest';
import { detectBrowserLanguage, isAppLanguage } from './index';

describe('detectBrowserLanguage', () => {
  it('returns ja when a Japanese locale is preferred', () => {
    expect(detectBrowserLanguage(['ja', 'en-US'])).toBe('ja');
    expect(detectBrowserLanguage(['ja-JP'])).toBe('ja');
  });

  it('returns en when Japanese is not preferred', () => {
    expect(detectBrowserLanguage(['en-US', 'ja'])).toBe('en');
    expect(detectBrowserLanguage(['fr-FR'])).toBe('en');
    expect(detectBrowserLanguage([])).toBe('en');
  });
});

describe('isAppLanguage', () => {
  it('accepts only en and ja', () => {
    expect(isAppLanguage('en')).toBe(true);
    expect(isAppLanguage('ja')).toBe(true);
    expect(isAppLanguage('fr')).toBe(false);
  });
});
