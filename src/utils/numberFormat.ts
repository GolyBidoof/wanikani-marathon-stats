import { localeTagForLanguage } from '../i18n';

export function localeForLanguage(language?: string): string {
  return localeTagForLanguage(language === 'ja' ? 'ja' : 'en');
}

/** Follows the app language, not the visitor's OS locale, so a card renders the same everywhere. */
export function formatNumber(value: number, language?: string): string {
  return value.toLocaleString(localeForLanguage(language));
}
