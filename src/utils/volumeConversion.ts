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

export function metricsOrderForConversion(
  metrics: Iterable<string>,
  conversionEnabled: boolean,
): string[] {
  const result: string[] = [];
  let volumeIncluded = false;

  for (const metric of metrics) {
    if (metric === 'volume') {
      if (conversionEnabled && !volumeIncluded) {
        result.push('volume');
        volumeIncluded = true;
      }
      continue;
    }
    result.push(metric);
  }

  if (conversionEnabled && !volumeIncluded) {
    const charsIndex = result.indexOf('chars');
    const pagesIndex = result.indexOf('pages');
    const insertAt = Math.max(charsIndex, pagesIndex) + 1;
    if (insertAt <= 0) {
      result.push('volume');
    } else {
      result.splice(insertAt, 0, 'volume');
    }
  }

  return result;
}

export function migrateEnabledMetricsForConversion(
  enabled: Set<string>,
  conversionEnabled: boolean,
): Set<string> {
  const next = new Set(enabled);

  if (conversionEnabled) {
    next.delete('pages');
    next.delete('chars');
    next.add('volume');
    return next;
  }

  if (next.has('volume')) {
    next.delete('volume');
    next.add('pages');
    next.add('chars');
  }

  return next;
}
