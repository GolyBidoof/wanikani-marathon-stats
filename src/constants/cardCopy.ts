import type { CardLanguage, JaCardNumberStyle, NicknameCase } from '../types';
import i18n from '../i18n';

// Matches the official readathon naming: equinoxes + solstices.
const MARATHON_TERM_JA: Record<string, string> = {
  Spring: '春分',
  Summer: '夏至',
  Fall: '秋分',
  Autumn: '秋分',
  Winter: '冬至',
};

export interface CardNumberFormatOptions {
  jaNumberStyle?: JaCardNumberStyle;
  roundNumbers?: boolean;
}

function formatWesternLocale(count: number, maxFractionDigits = 0): string {
  return count.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

function formatCompactDecimal(value: number, maxFractionDigits = 1): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Japanese Words exact: 12905 → 1万2905, 1500 → 1千500 */
function formatJapaneseManSenExact(n: number): string {
  const int = Math.round(n);
  if (int < 1000) return String(int);

  if (int >= 10000) {
    const man = Math.floor(int / 10000);
    const rem = int % 10000;
    return rem === 0 ? `${man}万` : `${man}万${rem}`;
  }

  const sen = Math.floor(int / 1000);
  const rem = int % 1000;
  return rem === 0 ? `${sen}千` : `${sen}千${rem}`;
}

/** Japanese Words rounded: 12905 → 1.3万, 1500 → 1.5千 */
function formatJapaneseRounded(n: number): string {
  const int = Math.round(n);
  if (int < 1000) return String(int);
  if (int >= 10000) {
    return `${formatCompactDecimal(int / 10000)}万`;
  }
  return `${formatCompactDecimal(int / 1000)}千`;
}

/** English rounded: 12905 → 12.9k, 1500000 → 1.5M */
function formatEnglishRounded(n: number): string {
  const int = Math.round(n);
  if (int >= 1_000_000) {
    return `${formatCompactDecimal(int / 1_000_000)}M`;
  }
  if (int >= 1000) {
    return `${formatCompactDecimal(int / 1000)}k`;
  }
  return formatWesternLocale(int);
}

export function formatCardNumber(
  count: number,
  language: CardLanguage,
  jaNumberStyle: JaCardNumberStyle = 'words',
  roundNumbers = false,
): string {
  if (language === 'ja') {
    if (roundNumbers) {
      return formatJapaneseRounded(count);
    }
    if (jaNumberStyle === 'words') {
      return formatJapaneseManSenExact(count);
    }
    return formatWesternLocale(count);
  }

  if (roundNumbers) {
    return formatEnglishRounded(count);
  }

  return formatWesternLocale(count);
}

function formatCardCount(
  count: number,
  language: CardLanguage,
  options: CardNumberFormatOptions = {},
): string {
  return formatCardNumber(
    count,
    language,
    options.jaNumberStyle ?? 'words',
    options.roundNumbers ?? false,
  );
}

type CardCopy = {
  tagline: string;
  totalTimeRead: string;
  averageTime: string;
  marathons: string;
  participants: string;
  pages: string;
  chars: string;
  volume: string;
  sources: string;
  sidebarNone: string;
  sidebarAllTime: string;
  sidebarPastYear: string;
  sidebarManual: string;
  pagesUnit: (count: number, options?: CardNumberFormatOptions) => string;
  charsUnit: (count: number, options?: CardNumberFormatOptions) => string;
  sourcesUnit: (count: number, options?: CardNumberFormatOptions) => string;
};

function buildCardCopy(language: CardLanguage): CardCopy {
  const translate = (key: string, options?: Record<string, string>) =>
    i18n.t(`card.${key}`, { lng: language, ...options });

  return {
    tagline: translate('tagline'),
    totalTimeRead: translate('totalTimeRead'),
    averageTime: translate('averageTime'),
    marathons: translate('marathons'),
    participants: translate('participants'),
    pages: translate('pages'),
    chars: translate('chars'),
    volume: translate('volume'),
    sources: translate('sources'),
    sidebarNone: translate('sidebarNone'),
    sidebarAllTime: translate('sidebarAllTime'),
    sidebarPastYear: translate('sidebarPastYear'),
    sidebarManual: translate('sidebarManual'),
    pagesUnit: (count, options) =>
      translate('pagesUnit', { count: formatCardCount(count, language, options) }),
    charsUnit: (count, options) =>
      translate('charsUnit', { count: formatCardCount(count, language, options) }),
    sourcesUnit: (count, options) =>
      translate('sourcesUnit', { count: formatCardCount(count, language, options) }),
  };
}

/** Lazily resolved so strings always come from the current i18n catalogs. */
export const cardCopy: Record<CardLanguage, CardCopy> = {
  get en() {
    return buildCardCopy('en');
  },
  get ja() {
    return buildCardCopy('ja');
  },
};

export function formatHoursForCard(
  time: number,
  language: CardLanguage,
  jaNumberStyle: JaCardNumberStyle = 'words',
): string {
  const totalMinutes = Math.round(time * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (language === 'ja') {
    if (jaNumberStyle === 'numbers') {
      return `${h}:${m.toString().padStart(2, '0')}`;
    }
    return `${h}時間${m}分`;
  }

  return `${h}h ${m}m`;
}

export function formatMarathonTitle(
  marathonName: string,
  language: CardLanguage,
  jaNumberStyle: JaCardNumberStyle = 'words',
): string {
  const [season, year] = marathonName.split(' ');
  if (!season || !year) return marathonName;

  if (language === 'ja') {
    const jaTerm = MARATHON_TERM_JA[season] || season;
    if (jaNumberStyle === 'numbers') {
      return `${year}${jaTerm}`;
    }
    return `${year}年${jaTerm}`;
  }

  return marathonName.toUpperCase();
}

/** UI label for a marathon (theme buttons, history cards). Keeps English casing natural. */
export function formatMarathonUiLabel(
  marathonName: string,
  language: CardLanguage,
  jaNumberStyle: JaCardNumberStyle = 'words',
): string {
  if (language === 'ja') {
    return formatMarathonTitle(marathonName, language, jaNumberStyle);
  }
  return marathonName;
}

export function formatCardTitle(
  name: string,
  language: CardLanguage,
  isUser: boolean,
  nicknameCase: NicknameCase = 'uppercase',
  jaNumberStyle: JaCardNumberStyle = 'words',
): string {
  if (isUser) {
    return nicknameCase === 'uppercase' ? name.toUpperCase() : name;
  }

  return formatMarathonTitle(name, language, jaNumberStyle);
}

export function formatSeasonLabel(
  season: string,
  year: string,
  language: CardLanguage,
  _jaNumberStyle: JaCardNumberStyle = 'words',
): string {
  const shortYear = year.slice(-2);

  if (language === 'ja') {
    const jaTerm = MARATHON_TERM_JA[season] || season;
    return `${shortYear}年${jaTerm}`;
  }

  const shortSeason = season.substring(0, 3).toUpperCase();
  return `${shortSeason} '${shortYear}`;
}

export function formatSidebarYear(year: string, jaNumberStyle: JaCardNumberStyle): string {
  if (jaNumberStyle === 'numbers') {
    return year;
  }
  return `${year}年`;
}
