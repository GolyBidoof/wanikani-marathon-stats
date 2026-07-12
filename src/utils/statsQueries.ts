import { getMarathonOrder, parseTimeToHours } from './helpers';
import { getEntryUnifiedVolume, isVolumeConversionActive } from './volumeConversion';
import type {
  AllStats,
  ChartMetric,
  MetricName,
  ParticipantEntry,
  SortMode,
  VolumeConversionConfig,
} from '../types';

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

export function findUserEntry(
  allStats: AllStats,
  marathonName: string,
  username: string,
): ParticipantEntry | undefined {
  const normalized = normalizeUsername(username);
  return (allStats[marathonName] || []).find(
    (entry) => normalizeUsername(entry.user) === normalized,
  );
}

export function getUserMarathonNames(allStats: AllStats, username: string): string[] {
  if (!username) return [];
  return getMarathonOrder(allStats).filter((name) => findUserEntry(allStats, name, username));
}

export function userParticipatedInMarathon(
  allStats: AllStats,
  marathonName: string,
  username: string,
): boolean {
  return Boolean(findUserEntry(allStats, marathonName, username));
}

export function getMetricValue(
  entry: ParticipantEntry | undefined,
  metric: MetricName | ChartMetric | undefined,
  volumeConversion?: VolumeConversionConfig,
  isUserView = false,
): number {
  if (!entry || !metric) return 0;

  if (
    isVolumeConversionActive(
      volumeConversion ?? { enabled: false, displayAs: 'chars', charsPerPage: 1 },
      isUserView,
    ) &&
    (metric === 'volume' || metric === 'pages' || metric === 'chars' || metric === 'characters')
  ) {
    return getEntryUnifiedVolume(entry, volumeConversion!);
  }

  if (metric === 'time') return parseTimeToHours(entry.time);
  if (metric === 'pages') return parseInt(String(entry.pages)) || 0;
  if (metric === 'chars' || metric === 'characters') return parseInt(String(entry.characters)) || 0;
  if (metric === 'sources') return parseInt(String(entry.sources)) || 0;
  if (metric === 'volume') return 0;
  return 0;
}

export interface SummaryTotals {
  time: number;
  pages: number;
  chars: number;
  sources: number;
  count: number;
  history: string[];
}

export function computeCommunityTotals(allStats: AllStats, marathonName: string): SummaryTotals {
  const participants = allStats[marathonName] || [];
  let time = 0;
  let pages = 0;
  let chars = 0;
  let sources = 0;

  for (const entry of participants) {
    time += getMetricValue(entry, 'time');
    pages += getMetricValue(entry, 'pages');
    chars += getMetricValue(entry, 'chars');
    sources += getMetricValue(entry, 'sources');
  }

  return {
    time,
    pages,
    chars,
    sources,
    count: participants.length,
    history: marathonName ? [marathonName] : [],
  };
}

export function computeUserTotals(
  allStats: AllStats,
  username: string,
  options: { filterTotals: boolean; excludedMarathons: Set<string> },
): SummaryTotals {
  const history: string[] = [];
  let time = 0;
  let pages = 0;
  let chars = 0;
  let sources = 0;
  let count = 0;

  for (const marathonName of getMarathonOrder(allStats)) {
    const entry = findUserEntry(allStats, marathonName, username);
    if (!entry) continue;

    history.push(marathonName);
    if (options.filterTotals && options.excludedMarathons.has(marathonName)) continue;

    count++;
    time += getMetricValue(entry, 'time');
    pages += getMetricValue(entry, 'pages');
    chars += getMetricValue(entry, 'chars');
    sources += getMetricValue(entry, 'sources');
  }

  return { time, pages, chars, sources, count, history };
}

export interface SortMarathonsOptions {
  sortMode: SortMode;
  sortMetric?: MetricName;
  manualOrder: string[];
  allStats: AllStats;
  username: string;
  volumeConversion?: VolumeConversionConfig;
}

export function sortMarathonNames(marathons: string[], options: SortMarathonsOptions): string[] {
  const sorted = [...marathons];

  if (options.sortMode === 'metric' && options.sortMetric) {
    const metric = options.sortMetric;
    sorted.sort((marathonA, marathonB) => {
      const entryA = findUserEntry(options.allStats, marathonA, options.username);
      const entryB = findUserEntry(options.allStats, marathonB, options.username);
      return (
        getMetricValue(entryB, metric, options.volumeConversion, Boolean(options.username)) -
        getMetricValue(entryA, metric, options.volumeConversion, Boolean(options.username))
      );
    });
    return sorted;
  }

  if (options.sortMode === 'manual') {
    sorted.sort((a, b) => options.manualOrder.indexOf(a) - options.manualOrder.indexOf(b));
  }

  return sorted;
}

export interface ChartSeries {
  labels: string[];
  values: number[];
}

export function buildChartSeries(
  allStats: AllStats,
  metric: ChartMetric,
  options: {
    username: string;
    filterTotals: boolean;
    excludedMarathons: Set<string>;
    volumeConversion?: VolumeConversionConfig;
  },
): ChartSeries {
  const labels: string[] = [];
  const values: number[] = [];
  const isUserView = Boolean(options.username);
  const useVolume = isVolumeConversionActive(
    options.volumeConversion ?? { enabled: false, displayAs: 'chars', charsPerPage: 1 },
    isUserView,
  );

  for (const marathonName of getMarathonOrder(allStats)) {
    if (!options.username) {
      const entries = allStats[marathonName] || [];
      if (entries.length === 0) continue;

      labels.push(marathonName);
      values.push(
        metric === 'participants'
          ? entries.length
          : entries.reduce((sum, entry) => sum + getMetricValue(entry, metric), 0),
      );
      continue;
    }

    const entry = findUserEntry(allStats, marathonName, options.username);
    if (!entry) continue;
    if (options.filterTotals && options.excludedMarathons.has(marathonName)) continue;

    labels.push(marathonName);
    if (useVolume && (metric === 'pages' || metric === 'characters')) {
      values.push(getEntryUnifiedVolume(entry, options.volumeConversion!));
    } else {
      values.push(getMetricValue(entry, metric, options.volumeConversion, isUserView));
    }
  }

  return { labels, values };
}

export function getLastYearMarathonNames(allStats: AllStats): Set<string> {
  return new Set(getMarathonOrder(allStats).slice(-4));
}
