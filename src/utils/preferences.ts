import { gifBackgrounds, accentColors } from '../constants';
import { DEFAULT_CHARS_PER_PAGE } from './volumeConversion';
import type {
  CardLanguage,
  JaCardNumberStyle,
  MetricName,
  NicknameCase,
  SortMode,
  VolumeConversionConfig,
  VolumeDisplayUnit,
} from '../types';

const STORAGE_KEY = 'wk-marathon-prefs-v1';
const PER_USER_KEY = 'wk-marathon-user-marathons-v1';

export interface PerUserMarathonPrefs {
  excludedMarathons: string[];
  userMarathonsOrder: string[];
}

export interface PersistedPreferences {
  currentBg: string;
  currentAccentColor: string;
  currentSortMode: SortMode;
  enabledMetrics: MetricName[];
  userMetricsOrder: MetricName[];
  showHistory: boolean;
  filterTotals: boolean;
  cardLanguage: CardLanguage;
  cardNicknameCase: NicknameCase;
  cardJaNumberStyle: JaCardNumberStyle;
  cardRoundNumbers: boolean;
  volumeConversion: VolumeConversionConfig;
}

const DEFAULT_PREFS: PersistedPreferences = {
  currentBg: gifBackgrounds[0],
  currentAccentColor: accentColors[0],
  currentSortMode: 'chrono',
  enabledMetrics: ['time'],
  userMetricsOrder: ['time', 'pages', 'chars', 'sources'],
  showHistory: true,
  filterTotals: false,
  cardLanguage: 'en',
  cardNicknameCase: 'uppercase',
  cardJaNumberStyle: 'words',
  cardRoundNumbers: false,
  volumeConversion: {
    enabled: false,
    displayAs: 'chars',
    charsPerPage: DEFAULT_CHARS_PER_PAGE,
  },
};

const METRIC_NAMES: MetricName[] = ['time', 'pages', 'chars', 'sources', 'volume'];
const SORT_MODES: SortMode[] = ['chrono', 'metric', 'manual'];
const CARD_LANGUAGES: CardLanguage[] = ['en', 'ja'];
const NICKNAME_CASES: NicknameCase[] = ['normal', 'uppercase'];
const JA_NUMBER_STYLES: JaCardNumberStyle[] = ['words', 'numbers'];
const VOLUME_UNITS: VolumeDisplayUnit[] = ['pages', 'chars'];

function isMetricName(value: unknown): value is MetricName {
  return typeof value === 'string' && METRIC_NAMES.includes(value as MetricName);
}

function sanitizePreferences(raw: unknown): PersistedPreferences {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFS;
  const data = raw as Partial<PersistedPreferences>;

  return {
    currentBg:
      typeof data.currentBg === 'string' && gifBackgrounds.includes(data.currentBg)
        ? data.currentBg
        : DEFAULT_PREFS.currentBg,
    currentAccentColor:
      typeof data.currentAccentColor === 'string'
        ? data.currentAccentColor
        : DEFAULT_PREFS.currentAccentColor,
    currentSortMode: SORT_MODES.includes(data.currentSortMode as SortMode)
      ? (data.currentSortMode as SortMode)
      : DEFAULT_PREFS.currentSortMode,
    enabledMetrics: Array.isArray(data.enabledMetrics)
      ? data.enabledMetrics.filter(isMetricName)
      : DEFAULT_PREFS.enabledMetrics,
    userMetricsOrder: Array.isArray(data.userMetricsOrder)
      ? data.userMetricsOrder.filter(isMetricName)
      : DEFAULT_PREFS.userMetricsOrder,
    showHistory:
      typeof data.showHistory === 'boolean' ? data.showHistory : DEFAULT_PREFS.showHistory,
    filterTotals:
      typeof data.filterTotals === 'boolean' ? data.filterTotals : DEFAULT_PREFS.filterTotals,
    cardLanguage: CARD_LANGUAGES.includes(data.cardLanguage as CardLanguage)
      ? (data.cardLanguage as CardLanguage)
      : DEFAULT_PREFS.cardLanguage,
    cardNicknameCase: NICKNAME_CASES.includes(data.cardNicknameCase as NicknameCase)
      ? (data.cardNicknameCase as NicknameCase)
      : DEFAULT_PREFS.cardNicknameCase,
    cardJaNumberStyle: JA_NUMBER_STYLES.includes(data.cardJaNumberStyle as JaCardNumberStyle)
      ? (data.cardJaNumberStyle as JaCardNumberStyle)
      : DEFAULT_PREFS.cardJaNumberStyle,
    cardRoundNumbers:
      typeof data.cardRoundNumbers === 'boolean'
        ? data.cardRoundNumbers
        : DEFAULT_PREFS.cardRoundNumbers,
    volumeConversion: {
      enabled:
        typeof data.volumeConversion?.enabled === 'boolean'
          ? data.volumeConversion.enabled
          : DEFAULT_PREFS.volumeConversion.enabled,
      displayAs: VOLUME_UNITS.includes(data.volumeConversion?.displayAs as VolumeDisplayUnit)
        ? (data.volumeConversion!.displayAs as VolumeDisplayUnit)
        : DEFAULT_PREFS.volumeConversion.displayAs,
      charsPerPage:
        Number.isFinite(data.volumeConversion?.charsPerPage) &&
        (data.volumeConversion?.charsPerPage ?? 0) > 0
          ? Math.round(data.volumeConversion!.charsPerPage)
          : DEFAULT_PREFS.volumeConversion.charsPerPage,
    },
  };
}

export function loadPreferences(): PersistedPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: PersistedPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable or full — ignore.
  }
}

export function getDefaultPreferences(): PersistedPreferences {
  return { ...DEFAULT_PREFS };
}

function readPerUserStore(): Record<string, PerUserMarathonPrefs> {
  try {
    const raw = localStorage.getItem(PER_USER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PerUserMarathonPrefs>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function loadPerUserMarathonPrefs(username: string): PerUserMarathonPrefs {
  const store = readPerUserStore();
  const entry = store[username];
  return {
    excludedMarathons: Array.isArray(entry?.excludedMarathons) ? entry.excludedMarathons : [],
    userMarathonsOrder: Array.isArray(entry?.userMarathonsOrder) ? entry.userMarathonsOrder : [],
  };
}

export function savePerUserMarathonPrefs(username: string, prefs: PerUserMarathonPrefs): void {
  try {
    const store = readPerUserStore();
    store[username] = prefs;
    localStorage.setItem(PER_USER_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable or full — ignore.
  }
}
