import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ja from './locales/ja';

export type AppLanguage = 'en' | 'ja';

export const APP_LANGUAGES: AppLanguage[] = ['en', 'ja'];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'en' || value === 'ja';
}

/** Map browser locale tags to a supported app language. */
export function detectBrowserLanguage(
  languages: readonly string[] = typeof navigator !== 'undefined'
    ? navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    : ['en'],
): AppLanguage {
  for (const tag of languages) {
    if (!tag) continue;
    const primary = tag.toLowerCase().split('-')[0];
    if (primary === 'ja') return 'ja';
    if (primary === 'en') return 'en';
  }
  return 'en';
}

export function localeTagForLanguage(language: AppLanguage): string {
  return language === 'ja' ? 'ja-JP' : 'en-US';
}

export function setAppDocumentLang(language: AppLanguage): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
