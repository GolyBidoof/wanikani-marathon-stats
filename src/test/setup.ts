import '@testing-library/jest-dom/vitest';
import { expect, beforeEach } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
import i18n, { setAppDocumentLang } from '../i18n';

expect.extend(toHaveNoViolations);

void i18n.changeLanguage('en');
setAppDocumentLang('en');

const storage = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  },
  configurable: true,
});

beforeEach(() => {
  storage.clear();
  void i18n.changeLanguage('en');
  setAppDocumentLang('en');
});
