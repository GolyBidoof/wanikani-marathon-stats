// WaniKani-only shortcodes map to the closest standard emoji (":durtle_tomato:" → 🍅).
export const emojiShortcodes: Record<string, string> = {
  basketball: '🏀',
  bat: '🦇',
  beaver: '🦫',
  black_cat: '🐈‍⬛',
  blue_heart: '💙',
  cherry_blossom: '🌸',
  dog: '🐕',
  dog_face: '🐶',
  dragon: '🐉',
  durtle_tomato: '🍅',
  eyes: '👀',
  flying_saucer: '🛸',
  four_leaf_clover: '🍀',
  fox: '🦊',
  ghost: '👻',
  grinning_cat: '😺',
  herb: '🌿',
  hot_beverage: '☕',
  hotdog: '🌭',
  jellyfish: '🪼',
  moon_viewing_ceremony: '🎑',
  mouse_face: '🐭',
  polar_bear: '🐻‍❄️',
  ram: '🐏',
  running_shoe: '👟',
  skull_and_crossbones: '☠️',
  strawberry: '🍓',
  teacup_without_handle: '🍵',
  tiger: '🐅',
  white_check_mark: '✅',
  wolf: '🐺',
  yellow_heart: '💛',
};

const SHORTCODE_PATTERN = /^:([a-z0-9_+-]+):$/i;
const EMOJI_CHARACTER_PATTERN = /\p{Extended_Pictographic}/u;

export function isEmojiToken(token: string): boolean {
  return EMOJI_CHARACTER_PATTERN.test(token);
}

/** Twemoji art in `public/badges/emoji/`, named by codepoints: "🐏" → `1f40f.png`. */
export function emojiAssetFilename(emoji: string): string {
  const codepoints = [...emoji]
    .map((character) => character.codePointAt(0) ?? 0)
    .filter((codepoint) => codepoint !== 0xfe0f);
  return `${codepoints.map((codepoint) => codepoint.toString(16)).join('-')}.png`;
}

export function emojiAssetPaths(emoji: string): string[] {
  return resolveEmojiList(emoji).map(
    (character) => `badges/emoji/${emojiAssetFilename(character)}`,
  );
}

interface BadgeToken {
  name: string;
  character: string;
}

function badgeTokens(raw: string | undefined | null): BadgeToken[] {
  if (!raw) return [];

  const tokens: BadgeToken[] = [];
  for (const token of raw.trim().split(/\s+/)) {
    const shortcode = token.match(SHORTCODE_PATTERN);
    if (shortcode) {
      const key = shortcode[1].toLowerCase();
      const character = emojiShortcodes[key];
      if (character) tokens.push({ name: key.replace(/_/g, ' '), character });
      continue;
    }
    if (isEmojiToken(token)) tokens.push({ name: token, character: token });
  }

  return tokens;
}

export function resolveEmojiList(raw: string | undefined | null): string[] {
  return badgeTokens(raw).map((token) => token.character);
}

/** Screen-reader name for a badge, using the shortcode itself or the custom art's filename. */
export function describeBadge(
  emoji: string | undefined | null,
  emojiImage?: string | null,
): string | null {
  const names = badgeTokens(emoji).map((token) => token.name);
  if (names.length > 0) return names.join(', ');

  const filename =
    emojiImage
      ?.split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ?? '';
  return filename ? filename.replace(/[_-]+/g, ' ') : null;
}
