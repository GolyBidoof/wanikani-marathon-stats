import { describe, expect, it } from 'vitest';
import { formatCardNumber, formatSeasonLabel } from './cardCopy';

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
