import type { SummaryDrawContext } from '../utils/drawSummaryCard';
import { isVolumeConversionActive } from './volumeConversion';

export function buildAchievementCardDescription(ctx: SummaryDrawContext): string {
  const { state, currentQuery, cardLanguage, volumeConversion } = ctx;
  const isUser = Boolean(currentQuery);
  const volumeActive = isVolumeConversionActive(volumeConversion, isUser);

  const subject = isUser ? `${state.name}'s` : `${state.name} community`;
  const countLabel = isUser ? 'marathons' : 'participants';

  const statParts = [
    `${countLabel}: ${state.count}`,
    volumeActive && state.volume != null
      ? `reading volume: ${Math.round(state.volume)}`
      : `pages: ${state.pages}, characters: ${state.chars}`,
    `sources: ${state.sources}`,
    `total reading time: ${state.time.toFixed(1)} hours`,
  ];

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
