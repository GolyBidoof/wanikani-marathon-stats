// ".ts" is required: scripts/import-marathon.ts loads this via node --experimental-strip-types.
import { isEmojiToken } from '../constants/emoji.ts';

const EMPTY_CELL_PATTERN = /^(?:|-|–|—|n\/?a|\?|\\-)$/i;
const MARKDOWN_LINK_PATTERN = /^\[([^\]]+)\]\(([^)]+)\)$/;
const SHORTCODE_PATTERN = /^:[a-z0-9_+-]+:$/i;
const THOUSANDS_PATTERN = /^(\d+(?:\.\d+)?)\s*k$/i;
const NUMERIC_RANGE_PATTERN = /^(\d+)\s*[-–—]\s*(\d+)$/;

export interface ParsedParticipant {
  user: string;
  time?: string;
  pages?: number;
  characters?: number;
  sources?: number;
  url?: string;
  emoji?: string;
  emojiImage?: string;
}

export interface ParsedNumericCell {
  value?: number;
  warning?: string;
}

export interface ParsedTimeCell {
  time?: string;
  warning?: string;
}

export function normalizeCell(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .replace(/^\\-/, '-')
    .replace(/\u00a0/g, ' ');
}

export function isEmptyCell(cell: string): boolean {
  return EMPTY_CELL_PATTERN.test(normalizeCell(cell));
}

export function parseUserCell(cell: string): { user: string; url?: string } {
  const cellText = normalizeCell(cell);
  const markdownLink = cellText.match(MARKDOWN_LINK_PATTERN);
  if (markdownLink) {
    return { user: markdownLink[1].trim(), url: markdownLink[2].trim() };
  }
  return { user: cellText };
}

const BADGE_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s]+)\)/;

export interface ParsedBadge {
  emoji?: string;
  emojiImage?: string;
}

function slugifyBadgeFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Shortcode, literal emoji, or a custom image vendored under `public/badges/`. */
export function parseBadgeCell(cell: string): ParsedBadge {
  const cellText = normalizeCell(cell);
  if (isEmptyCell(cellText)) return {};

  const image = cellText.match(BADGE_IMAGE_PATTERN);
  if (image) {
    const altText = image[1].split(/\\\||\|/)[0];
    const urlFilename = image[2].split('/').pop() ?? '';
    const extension = urlFilename.includes('.') ? urlFilename.split('.').pop()! : 'gif';
    const baseName =
      slugifyBadgeFilename(altText) ||
      slugifyBadgeFilename(urlFilename.replace(/\.[^.]+$/, '')) ||
      'badge';
    return { emojiImage: `badges/${baseName}.${extension.toLowerCase()}` };
  }

  const tokens = cellText
    .split(/\s+/)
    .filter((token) => SHORTCODE_PATTERN.test(token) || isEmojiToken(token));

  return tokens.length > 0 ? { emoji: tokens.join(' ') } : {};
}

export function parseTimeCell(cell: string): ParsedTimeCell {
  if (isEmptyCell(cell)) return {};
  const cellText = normalizeCell(cell);
  const timeParts = cellText.split(':').map((part) => part.trim());
  if (
    timeParts.length < 2 ||
    timeParts.length > 3 ||
    timeParts.some((part) => part === '' || Number.isNaN(Number(part)))
  ) {
    return { warning: `Unrecognized time "${cellText}"` };
  }

  const [hoursText, minutesText, secondsText = '0'] = timeParts;
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  if (minutes > 59 || seconds > 59 || hours < 0 || minutes < 0 || seconds < 0) {
    return { warning: `Out-of-range time "${cellText}"` };
  }

  return {
    time: [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':'),
  };
}

export function parseNumericCell(cell: string, fieldName: string): ParsedNumericCell {
  if (isEmptyCell(cell)) return {};
  const cellText = normalizeCell(cell).replace(/,/g, '');

  const numericRange = cellText.match(NUMERIC_RANGE_PATTERN);
  if (numericRange) {
    const higherValue = Number(numericRange[2]);
    return {
      value: higherValue,
      warning: `${fieldName} range "${cellText}" → using ${higherValue}`,
    };
  }

  const thousandsMatch = cellText.match(THOUSANDS_PATTERN);
  if (thousandsMatch) {
    return { value: Math.round(Number(thousandsMatch[1]) * 1000) };
  }

  if (!/^\d+(?:\.\d+)?$/.test(cellText)) {
    return { warning: `Unrecognized ${fieldName} "${cellText}"` };
  }

  const numericValue = Number(cellText);
  if (!Number.isFinite(numericValue)) {
    return { warning: `Unrecognized ${fieldName} "${cellText}"` };
  }

  return { value: Math.round(numericValue) };
}

/** Stand-in for "\|" while a row is split, so escaped pipes stay inside one cell. */
const ESCAPED_PIPE = '\u0001';

export function splitTableRow(line: string): string[] | null {
  const trimmedLine = line.trim();
  if (!trimmedLine.startsWith('|')) return null;

  const protect = (value: string) => value.split('\\|').join(ESCAPED_PIPE);
  const restore = (cells: string[]) => cells.map((cell) => cell.split(ESCAPED_PIPE).join('\\|'));

  const safeLine = protect(trimmedLine);
  const cellsBetweenPipes = restore(
    safeLine
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim()),
  );
  if (cellsBetweenPipes.length >= 5) return cellsBetweenPipes;

  const cellsWithoutTrailingPipe = restore(
    safeLine
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim()),
  );

  return cellsWithoutTrailingPipe.length >= 5 ? cellsWithoutTrailingPipe : null;
}

export function isSeparatorRow(line: string): boolean {
  const cells = splitTableRow(line);
  if (!cells) return false;
  return cells.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, '')) || cell === '');
}

export function isHeaderRow(cells: string[]): boolean {
  const headerText = cells.map((cell) => cell.toLowerCase()).join(' ');
  return headerText.includes('user') && headerText.includes('time');
}

/** Rows such as "**Total**:" or "**Goal 2**:" are tallies, not participants. */
export function isSummaryRow(cells: string[]): boolean {
  return /^\*{0,2}(?:total|goals?)(?:\s*\d+)?\*{0,2}:?\*{0,2}$/i.test(normalizeCell(cells[0]));
}

export function parseMarathonTable(markdown: string): {
  participants: ParsedParticipant[];
  warnings: string[];
} {
  const tableLines = String(markdown)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const participants: ParsedParticipant[] = [];
  const warnings: string[] = [];

  for (const line of tableLines) {
    const cells = splitTableRow(line);
    if (!cells || isSeparatorRow(line) || isHeaderRow(cells) || isSummaryRow(cells)) continue;

    const [userCell, timeCell, pagesCell, charactersCell, sourcesCell, emojiCell] = cells;
    if (isEmptyCell(userCell)) {
      warnings.push(`Skipping row with empty user: ${line}`);
      continue;
    }

    const { user, url } = parseUserCell(userCell);
    if (!user) {
      warnings.push(`Skipping row with empty user: ${line}`);
      continue;
    }

    const participant: ParsedParticipant = { user };
    if (url) participant.url = url;

    const parsedTime = parseTimeCell(timeCell);
    if (parsedTime.warning) warnings.push(`${user}: ${parsedTime.warning}`);
    if (parsedTime.time) participant.time = parsedTime.time;

    const parsedPages = parseNumericCell(pagesCell, 'pages');
    if (parsedPages.warning) warnings.push(`${user}: ${parsedPages.warning}`);
    if (parsedPages.value !== undefined) participant.pages = parsedPages.value;

    const parsedCharacters = parseNumericCell(charactersCell, 'characters');
    if (parsedCharacters.warning) warnings.push(`${user}: ${parsedCharacters.warning}`);
    if (parsedCharacters.value !== undefined) participant.characters = parsedCharacters.value;

    const parsedSources = parseNumericCell(sourcesCell, 'sources');
    if (parsedSources.warning) warnings.push(`${user}: ${parsedSources.warning}`);
    if (parsedSources.value !== undefined) participant.sources = parsedSources.value;

    const badge = parseBadgeCell(emojiCell ?? '');
    if (badge.emoji) participant.emoji = badge.emoji;
    if (badge.emojiImage) participant.emojiImage = badge.emojiImage;

    if (
      !participant.time &&
      participant.pages === undefined &&
      participant.characters === undefined
    ) {
      warnings.push(`${user}: no time/pages/characters — kept with available fields only`);
    }

    participants.push(participant);
  }

  if (participants.length === 0) {
    throw new Error('No participant rows found in markdown table');
  }

  return { participants, warnings };
}

export function marathonNameToGifFilename(marathonName: string): string {
  return `${String(marathonName).trim().toLowerCase().replace(/\s+/g, '')}.gif`;
}
