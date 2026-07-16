import type { SummaryDrawContext } from '../utils/drawSummaryCard';
import type { MultiChartSeriesData } from '../utils/chartConfig';
import { isVolumeConversionActive } from './volumeConversion';
import i18n from '../i18n';

export function buildAchievementCardDescription(ctx: SummaryDrawContext): string {
  const { state, currentQuery, cardLanguage, enabledSummaryMetrics, volumeConversion } = ctx;
  const isUser = Boolean(currentQuery);
  const volumeActive = isVolumeConversionActive(volumeConversion, isUser);

  const subject = i18n.t(isUser ? 'a11y.userSubject' : 'a11y.communitySubject', {
    name: state.name,
  });
  const countLabel = i18n.t(isUser ? 'a11y.marathons' : 'a11y.participants');
  const showPages = enabledSummaryMetrics?.has('pages') ?? true;
  const showChars = enabledSummaryMetrics?.has('chars') ?? true;
  const showCombined =
    volumeActive && Boolean(enabledSummaryMetrics?.has('volume')) && state.volume != null;

  const readingParts = [
    showPages || showChars
      ? i18n.t('a11y.pagesAndCharacters', { pages: state.pages, chars: state.chars })
      : null,
    showCombined ? i18n.t('a11y.combinedTotal', { value: Math.round(state.volume!) }) : null,
  ].filter((part): part is string => Boolean(part));

  const statParts = [
    `${countLabel}: ${state.count}`,
    ...(readingParts.length > 0
      ? readingParts
      : [i18n.t('a11y.pagesAndCharacters', { pages: state.pages, chars: state.chars })]),
    enabledSummaryMetrics?.has('sources') !== false
      ? i18n.t('a11y.sources', { value: state.sources })
      : null,
    i18n.t('a11y.totalReadingTime', { hours: state.time.toFixed(1) }),
    enabledSummaryMetrics?.has('avgTime') && state.count > 0
      ? i18n.t('a11y.averageTime', {
          hours: (state.time / state.count).toFixed(1),
          unit: i18n.t(isUser ? 'a11y.perMarathon' : 'a11y.perParticipant'),
        })
      : null,
  ].filter((part): part is string => Boolean(part));

  const historyNote =
    isUser && state.history.length > 0
      ? ` ${i18n.t('a11y.historyIncludes', { count: state.history.length })}`
      : '';

  const languageNote = cardLanguage === 'ja' ? ` ${i18n.t('a11y.cardDisplayedJapanese')}` : '';

  return i18n.t('a11y.achievementCardDescription', {
    subject,
    stats: `${statParts.join('. ')}.${historyNote}${languageNote}`,
  });
}

export function buildChartDescription(
  metricLabel: string,
  labels: string[],
  values: number[],
): string {
  if (labels.length === 0) {
    return i18n.t('a11y.chartSingleNoData', { metric: metricLabel });
  }

  const points = labels.map((label, index) => {
    const value = values[index] ?? 0;
    return i18n.t('a11y.chartPoint', { label, value: value.toLocaleString() });
  });

  return i18n.t('a11y.chartSingleDescription', {
    metric: metricLabel,
    count: labels.length,
    points: points.join('. '),
  });
}

export function buildMultiChartDescription(series: MultiChartSeriesData): string {
  if (series.labels.length === 0 || series.datasets.length === 0) {
    return i18n.t('a11y.chartNoData');
  }

  const modeNote = series.normalized
    ? i18n.t('a11y.chartNormalizedMode')
    : i18n.t('a11y.chartSeparateAxesMode');

  const seriesSummaries = series.datasets.map((dataset) => {
    const points = series.labels.map((label, index) => {
      const displayValue = dataset.values[index] ?? 0;
      const rawValue = dataset.rawValues[index] ?? 0;
      if (series.normalized) {
        return i18n.t('a11y.chartNormalizedPoint', {
          label,
          percent: Math.round(displayValue),
          value: rawValue.toLocaleString(),
        });
      }
      return i18n.t('a11y.chartPoint', { label, value: rawValue.toLocaleString() });
    });
    return `${dataset.label}: ${points.join(', ')}`;
  });

  return i18n.t('a11y.chartDescription', {
    marathonCount: series.labels.length,
    metricCount: series.datasets.length,
    mode: modeNote,
    series: seriesSummaries.join('. '),
  });
}
