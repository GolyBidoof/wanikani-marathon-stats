import type { ParticipantEntry, VolumeConversionConfig, VolumeDisplayUnit } from '../types';

export const DEFAULT_CHARS_PER_PAGE = 500;

export function isVolumeConversionActive(
  config: VolumeConversionConfig,
  isUserView: boolean,
): boolean {
  return isUserView && config.enabled && config.charsPerPage > 0;
}

export function getUnifiedVolume(
  pages: number,
  chars: number,
  displayAs: VolumeDisplayUnit,
  charsPerPage: number,
): number {
  if (displayAs === 'chars') {
    return chars + pages * charsPerPage;
  }
  return pages + chars / charsPerPage;
}

export function getEntryUnifiedVolume(
  entry: ParticipantEntry | undefined,
  config: VolumeConversionConfig,
): number {
  if (!entry) return 0;
  const pages = parseInt(String(entry.pages)) || 0;
  const chars = parseInt(String(entry.characters)) || 0;
  return getUnifiedVolume(pages, chars, config.displayAs, config.charsPerPage);
}

export function getVolumeChartMetric(config: VolumeConversionConfig): 'pages' | 'characters' {
  return config.displayAs === 'pages' ? 'pages' : 'characters';
}

export function replacePagesCharsWithVolume(metrics: Iterable<string>): string[] {
  const result: string[] = [];
  let volumeAdded = false;

  for (const metric of metrics) {
    if (metric === 'pages' || metric === 'chars') {
      if (!volumeAdded) {
        result.push('volume');
        volumeAdded = true;
      }
      continue;
    }
    result.push(metric);
  }

  return result;
}

export function migrateEnabledMetricsForConversion(
  enabled: Set<string>,
  conversionEnabled: boolean,
): Set<string> {
  const next = new Set(enabled);

  if (conversionEnabled) {
    const hadVolumeMetric = next.has('pages') || next.has('chars');
    next.delete('pages');
    next.delete('chars');
    if (hadVolumeMetric) next.add('volume');
    return next;
  }

  if (next.has('volume')) {
    next.delete('volume');
    next.add('pages');
    next.add('chars');
  }

  return next;
}
