import { describe, expect, it } from 'vitest';
import { cardCopy, formatCardNumber, formatMarathonUiLabel, formatSeasonLabel } from './cardCopy';

describe('formatCardNumber', () => {
  it('formats exact English numbers', () => {
    expect(formatCardNumber(12905, 'en', 'words', false)).toBe('12,905');
  });

  it('formats rounded English numbers', () => {
    expect(formatCardNumber(12905, 'en', 'words', true)).toBe('12.9k');
    expect(formatCardNumber(1_500_000, 'en', 'words', true)).toBe('1.5M');
  });

  it('formats exact Japanese word-style numbers', () => {
    expect(formatCardNumber(12905, 'ja', 'words', false)).toBe('1万2905');
    expect(formatCardNumber(1500, 'ja', 'words', false)).toBe('1千500');
  });

  it('formats rounded Japanese numbers with 万/千', () => {
    expect(formatCardNumber(12905, 'ja', 'words', true)).toBe('1.3万');
    expect(formatCardNumber(1500, 'ja', 'words', true)).toBe('1.5千');
  });
});

describe('formatSeasonLabel', () => {
  it('formats English season labels', () => {
    expect(formatSeasonLabel('Winter', '2025', 'en')).toBe("WIN '25");
  });

  it('formats Japanese season labels', () => {
    expect(formatSeasonLabel('Summer', '2026', 'ja')).toBe('26年夏至');
  });
});

describe('formatMarathonUiLabel', () => {
  it('keeps English marathon names as-is', () => {
    expect(formatMarathonUiLabel('Summer 2025', 'en')).toBe('Summer 2025');
  });

  it('formats Japanese marathon names with year and term', () => {
    expect(formatMarathonUiLabel('Summer 2025', 'ja')).toBe('2025年夏至');
    expect(formatMarathonUiLabel('Autumn 2025', 'ja', 'numbers')).toBe('2025秋分');
  });
});

describe('cardCopy', () => {
  it('uses locale-specific static copy and formatted unit counts', () => {
    expect(cardCopy.en.tagline).toBe('WaniKani Reading Marathon');
    expect(cardCopy.ja.tagline).toBe('WaniKani 読書マラソン');
    expect(cardCopy.en.pagesUnit(1_250)).toBe('1,250 pgs');
    expect(cardCopy.ja.pagesUnit(1_250)).toBe('1千250ページ');
  });
});
