import { gifBackgrounds, accentColors } from '../constants';
import { detectBrowserLanguage, isAppLanguage, type AppLanguage } from '../i18n';
import { DEFAULT_CHARS_PER_PAGE } from './volumeConversion';
import type {
  CardLanguage,
  JaCardNumberStyle,
  MetricName,
  NicknameCase,
  SortMode,
  SummaryMetricName,
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
  enabledSummaryMetrics: SummaryMetricName[];
  summaryMetricsOrder: SummaryMetricName[];
  showHistory: boolean;
  filterTotals: boolean;
  appLanguage: AppLanguage;
  cardLanguage: CardLanguage;
  cardNicknameCase: NicknameCase;
  cardJaNumberStyle: JaCardNumberStyle;
  cardRoundNumbers: boolean;
  volumeConversion: VolumeConversionConfig;
}

const METRIC_NAMES: MetricName[] = ['time', 'pages', 'chars', 'sources', 'volume'];
const SUMMARY_METRIC_NAMES: SummaryMetricName[] = [
  'avgTime',
  'pages',
  'chars',
  'sources',
  'volume',
];
const SORT_MODES: SortMode[] = ['chrono', 'metric', 'manual'];
const CARD_LANGUAGES: CardLanguage[] = ['en', 'ja'];
const NICKNAME_CASES: NicknameCase[] = ['normal', 'uppercase'];
const JA_NUMBER_STYLES: JaCardNumberStyle[] = ['words', 'numbers'];
const VOLUME_UNITS: VolumeDisplayUnit[] = ['pages', 'chars'];

function buildDefaultPreferences(
  language: AppLanguage = detectBrowserLanguage(),
): PersistedPreferences {
  return {
    currentBg: gifBackgrounds[gifBackgrounds.length - 1] || gifBackgrounds[0] || '',
    currentAccentColor: accentColors[0],
    currentSortMode: 'chrono',
    enabledMetrics: ['time'],
    userMetricsOrder: ['time', 'pages', 'chars', 'sources'],
    enabledSummaryMetrics: ['avgTime', 'pages', 'chars', 'sources'],
    summaryMetricsOrder: ['avgTime', 'pages', 'chars', 'sources'],
    showHistory: true,
    filterTotals: false,
    appLanguage: language,
    cardLanguage: language,
    cardNicknameCase: 'uppercase',
    cardJaNumberStyle: 'words',
    cardRoundNumbers: false,
    volumeConversion: {
      enabled: false,
      displayAs: 'chars',
      charsPerPage: DEFAULT_CHARS_PER_PAGE,
    },
  };
}

function isMetricName(value: unknown): value is MetricName {
  return typeof value === 'string' && METRIC_NAMES.includes(value as MetricName);
}

function isSummaryMetricName(value: unknown): value is SummaryMetricName {
  return typeof value === 'string' && SUMMARY_METRIC_NAMES.includes(value as SummaryMetricName);
}

function ensureSummaryMetricsOrder(order: SummaryMetricName[]): SummaryMetricName[] {
  const result = order.filter((metric) => SUMMARY_METRIC_NAMES.includes(metric));
  for (const metric of SUMMARY_METRIC_NAMES) {
    if (!result.includes(metric)) {
      if (metric === 'avgTime') result.unshift(metric);
      else result.push(metric);
    }
  }
  return result;
}

function sanitizePreferences(raw: unknown): PersistedPreferences {
  const defaults = buildDefaultPreferences();
  if (!raw || typeof raw !== 'object') return defaults;
  const data = raw as Partial<PersistedPreferences> & { appLanguage?: unknown };

  const appLanguage = isAppLanguage(data.appLanguage) ? data.appLanguage : defaults.appLanguage;
  const cardLanguage = CARD_LANGUAGES.includes(data.cardLanguage as CardLanguage)
    ? (data.cardLanguage as CardLanguage)
    : appLanguage;

  return {
    currentBg:
      typeof data.currentBg === 'string' && gifBackgrounds.includes(data.currentBg)
        ? data.currentBg
        : defaults.currentBg,
    currentAccentColor:
      typeof data.currentAccentColor === 'string'
        ? data.currentAccentColor
        : defaults.currentAccentColor,
    currentSortMode: SORT_MODES.includes(data.currentSortMode as SortMode)
      ? (data.currentSortMode as SortMode)
      : defaults.currentSortMode,
    enabledMetrics: Array.isArray(data.enabledMetrics)
      ? data.enabledMetrics.filter(isMetricName)
      : defaults.enabledMetrics,
    userMetricsOrder: Array.isArray(data.userMetricsOrder)
      ? data.userMetricsOrder.filter(isMetricName)
      : defaults.userMetricsOrder,
    enabledSummaryMetrics: Array.isArray(data.enabledSummaryMetrics)
      ? data.enabledSummaryMetrics.filter(isSummaryMetricName)
      : defaults.enabledSummaryMetrics,
    summaryMetricsOrder: ensureSummaryMetricsOrder(
      Array.isArray(data.summaryMetricsOrder)
        ? data.summaryMetricsOrder.filter(isSummaryMetricName)
        : defaults.summaryMetricsOrder,
    ),
    showHistory: typeof data.showHistory === 'boolean' ? data.showHistory : defaults.showHistory,
    filterTotals:
      typeof data.filterTotals === 'boolean' ? data.filterTotals : defaults.filterTotals,
    appLanguage,
    cardLanguage,
    cardNicknameCase: NICKNAME_CASES.includes(data.cardNicknameCase as NicknameCase)
      ? (data.cardNicknameCase as NicknameCase)
      : defaults.cardNicknameCase,
    cardJaNumberStyle: JA_NUMBER_STYLES.includes(data.cardJaNumberStyle as JaCardNumberStyle)
      ? (data.cardJaNumberStyle as JaCardNumberStyle)
      : defaults.cardJaNumberStyle,
    cardRoundNumbers:
      typeof data.cardRoundNumbers === 'boolean'
        ? data.cardRoundNumbers
        : defaults.cardRoundNumbers,
    volumeConversion: {
      enabled:
        typeof data.volumeConversion?.enabled === 'boolean'
          ? data.volumeConversion.enabled
          : defaults.volumeConversion.enabled,
      displayAs: VOLUME_UNITS.includes(data.volumeConversion?.displayAs as VolumeDisplayUnit)
        ? (data.volumeConversion!.displayAs as VolumeDisplayUnit)
        : defaults.volumeConversion.displayAs,
      charsPerPage:
        Number.isFinite(data.volumeConversion?.charsPerPage) &&
        (data.volumeConversion?.charsPerPage ?? 0) > 0
          ? Math.round(data.volumeConversion!.charsPerPage)
          : defaults.volumeConversion.charsPerPage,
    },
  };
}

export function loadPreferences(): PersistedPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultPreferences();
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return buildDefaultPreferences();
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
  return buildDefaultPreferences();
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
