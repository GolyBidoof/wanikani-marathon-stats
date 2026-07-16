import { useCallback, type KeyboardEvent } from 'react';
import type { ChartMetric } from '../types';

export function useChartMetricToggleKeyboard(
  metrics: ChartMetric[],
  onToggle: (metric: ChartMetric) => void,
) {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const focusedMetric = metrics.find((metric) => target?.id?.endsWith(`-metric-${metric}`));
      if (!focusedMetric) return;

      const currentIndex = metrics.indexOf(focusedMetric);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % metrics.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + metrics.length) % metrics.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = metrics.length - 1;
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        onToggle(focusedMetric);
        return;
      }

      if (nextIndex === null) return;

      event.preventDefault();
      const prefix = target?.id?.includes('expanded') ? 'chart-expanded' : 'chart';
      document.getElementById(`${prefix}-metric-${metrics[nextIndex]}`)?.focus();
    },
    [metrics, onToggle],
  );
}
