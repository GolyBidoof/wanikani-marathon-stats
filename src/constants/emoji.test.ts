import { describe, expect, it } from 'vitest';
import {
  describeBadge,
  emojiAssetFilename,
  emojiAssetPaths,
  emojiShortcodes,
  resolveEmojiList,
} from './emoji';

describe('resolveEmojiList', () => {
  it('resolves shortcodes to characters', () => {
    expect(resolveEmojiList(':ram:')).toEqual(['🐏']);
    expect(resolveEmojiList(':ram:')).toEqual([emojiShortcodes.ram]);
  });

  it('keeps literal emoji as-is', () => {
    expect(resolveEmojiList('🐧')).toEqual(['🐧']);
    expect(resolveEmojiList('🎶')).toEqual(['🎶']);
  });

  it('keeps every badge when a reader declared more than one', () => {
    expect(resolveEmojiList(':herb: :strawberry:')).toEqual(['🌿', '🍓']);
  });

  it('drops empty, unknown and non-emoji values', () => {
    expect(resolveEmojiList(undefined)).toEqual([]);
    expect(resolveEmojiList('')).toEqual([]);
    expect(resolveEmojiList(':not_a_real_emoji:')).toEqual([]);
    expect(resolveEmojiList('trunky')).toEqual([]);
    expect(resolveEmojiList(':ram: trunky')).toEqual(['🐏']);
  });
});

describe('emoji assets', () => {
  it('names assets after the emoji codepoints, dropping variation selectors', () => {
    expect(emojiAssetFilename('🐏')).toBe('1f40f.png');
    expect(emojiAssetFilename('☠️')).toBe('2620.png');
    expect(emojiAssetFilename('🐈‍⬛')).toBe('1f408-200d-2b1b.png');
  });

  it('points at the vendored badges/emoji folder', () => {
    expect(emojiAssetPaths(':ram:')).toEqual(['badges/emoji/1f40f.png']);
    expect(emojiAssetPaths(':herb: :strawberry:')).toEqual([
      'badges/emoji/1f33f.png',
      'badges/emoji/1f353.png',
    ]);
    expect(emojiAssetPaths('')).toEqual([]);
  });

  it('resolves every shipped shortcode to an asset name', () => {
    for (const [shortcode, character] of Object.entries(emojiShortcodes)) {
      expect(emojiAssetPaths(`:${shortcode}:`).length, shortcode).toBe(1);
      expect(emojiAssetFilename(character)).toMatch(/^[0-9a-f]+(-[0-9a-f]+)*\.png$/);
    }
  });
});

describe('describeBadge', () => {
  it('names shortcodes the way the reader would say them', () => {
    expect(describeBadge(':ram:')).toBe('ram');
    expect(describeBadge(':black_cat:')).toBe('black cat');
    expect(describeBadge(':durtle_tomato:')).toBe('durtle tomato');
  });

  it('keeps literal emoji and joins multiple badges', () => {
    expect(describeBadge('🐧')).toBe('🐧');
    expect(describeBadge(':herb: :strawberry:')).toBe('herb, strawberry');
  });

  it('falls back to the custom art filename, then to nothing', () => {
    expect(describeBadge(undefined, 'badges/trunky_rolling.gif')).toBe('trunky rolling');
    expect(describeBadge(':ram:', 'badges/trunky_rolling.gif')).toBe('ram');
    expect(describeBadge(undefined)).toBeNull();
    expect(describeBadge(':not_a_real_emoji:')).toBeNull();
  });
});
