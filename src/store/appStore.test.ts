import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

describe('app language preferences', () => {
  beforeEach(() => {
    useAppStore.setState({ appLanguage: 'en', cardLanguage: 'en' });
  });

  it('sets card language when the app language changes', () => {
    useAppStore.getState().setAppLanguage('ja');

    expect(useAppStore.getState()).toMatchObject({
      appLanguage: 'ja',
      cardLanguage: 'ja',
    });
  });

  it('keeps the app language when changing only the card language', () => {
    useAppStore.getState().setAppLanguage('ja');
    useAppStore.getState().setCardLanguage('en');

    expect(useAppStore.getState()).toMatchObject({
      appLanguage: 'ja',
      cardLanguage: 'en',
    });
  });
});
