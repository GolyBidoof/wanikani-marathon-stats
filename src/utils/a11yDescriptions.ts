import type { SummaryDrawContext } from '../utils/drawSummaryCard';
import type { MultiChartSeriesData } from '../utils/chartConfig';
import { isVolumeConversionActive } from './volumeConversion';

export function buildAchievementCardDescription(ctx: SummaryDrawContext): string {
  const { state, currentQuery, cardLanguage, enabledSummaryMetrics, volumeConversion } = ctx;
  const isUser = Boolean(currentQuery);
  const volumeActive = isVolumeConversionActive(volumeConversion, isUser);

  const subject = isUser ? `${state.name}'s` : `${state.name} community`;
  const countLabel = isUser ? 'marathons' : 'participants';
  const showPages = enabledSummaryMetrics?.has('pages') ?? true;
  const showChars = enabledSummaryMetrics?.has('chars') ?? true;
  const showCombined =
    volumeActive && Boolean(enabledSummaryMetrics?.has('volume')) && state.volume != null;

  const readingParts = [
    showPages || showChars ? `pages: ${state.pages}, characters: ${state.chars}` : null,
    showCombined ? `combined total: ${Math.round(state.volume!)}` : null,
  ].filter(Boolean);

  const statParts = [
    `${countLabel}: ${state.count}`,
    ...(readingParts.length > 0
      ? readingParts
      : [`pages: ${state.pages}, characters: ${state.chars}`]),
    enabledSummaryMetrics?.has('sources') !== false ? `sources: ${state.sources}` : null,
    `total reading time: ${state.time.toFixed(1)} hours`,
    enabledSummaryMetrics?.has('avgTime') && state.count > 0
      ? `average time: ${(state.time / state.count).toFixed(1)} hours per ${isUser ? 'marathon' : 'participant'}`
      : null,
  ].filter(Boolean);

  const historyNote =
    isUser && state.history.length > 0
      ? ` Marathon history includes ${state.history.length} events.`
      : '';

  const languageNote = cardLanguage === 'ja' ? ' Card displayed in Japanese.' : '';

  return `Achievement card for ${subject} readathon statistics. ${statParts.join('. ')}.${historyNote}${languageNote}`;
}

export function buildChartDescription(
  metricLabel: string,
  labels: string[],
  values: number[],
): string {
  if (labels.length === 0) {
    return `Chart showing ${metricLabel} across marathons. No data available.`;
  }

  const points = labels.map((label, index) => {
    const value = values[index] ?? 0;
    return `${label}: ${value.toLocaleString()}`;
  });

  return `Line chart of ${metricLabel} across ${labels.length} marathons. ${points.join('. ')}.`;
}

export function buildMultiChartDescription(series: MultiChartSeriesData): string {
  if (series.labels.length === 0 || series.datasets.length === 0) {
    return 'History chart. No data available.';
  }

  const modeNote = series.normalized
    ? ' Values are normalized to each series first marathon.'
    : ' Different units use separate axes.';

  const seriesSummaries = series.datasets.map((dataset) => {
    const points = series.labels.map((label, index) => {
      const displayValue = dataset.values[index] ?? 0;
      const rawValue = dataset.rawValues[index] ?? 0;
      if (series.normalized) {
        return `${label}: ${Math.round(displayValue)}% (raw ${rawValue.toLocaleString()})`;
      }
      return `${label}: ${rawValue.toLocaleString()}`;
    });
    return `${dataset.label}: ${points.join(', ')}`;
  });

  return `Line chart across ${series.labels.length} marathons with ${series.datasets.length} metrics.${modeNote} ${seriesSummaries.join('. ')}.`;
}
