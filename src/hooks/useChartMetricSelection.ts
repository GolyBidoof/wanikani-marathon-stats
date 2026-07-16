import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChartMetric } from '../types';

const DEFAULT_METRICS: ChartMetric[] = ['time'];

function toOrderedMetrics(selected: Set<ChartMetric>, available: ChartMetric[]): ChartMetric[] {
  return available.filter((metric) => selected.has(metric));
}

export function useChartMetricSelection(availableMetrics: ChartMetric[]) {
  const [selectedMetrics, setSelectedMetrics] = useState<Set<ChartMetric>>(
    () => new Set(DEFAULT_METRICS),
  );
  const [normalizeShapes, setNormalizeShapes] = useState(false);

  useEffect(() => {
    setSelectedMetrics((current) => {
      const next = new Set([...current].filter((metric) => availableMetrics.includes(metric)));
      if (next.size === 0 && availableMetrics.includes('time')) {
        next.add('time');
      } else if (next.size === 0 && availableMetrics[0]) {
        next.add(availableMetrics[0]);
      }
      if (next.size === current.size && [...next].every((metric) => current.has(metric))) {
        return current;
      }
      return next;
    });
  }, [availableMetrics]);

  const orderedSelectedMetrics = useMemo(
    () => toOrderedMetrics(selectedMetrics, availableMetrics),
    [selectedMetrics, availableMetrics],
  );

  const toggleMetric = useCallback((metric: ChartMetric) => {
    setSelectedMetrics((current) => {
      const next = new Set(current);
      if (next.has(metric)) {
        if (next.size === 1) return current;
        next.delete(metric);
        return next;
      }
      next.add(metric);
      return next;
    });
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedMetrics(
      new Set(DEFAULT_METRICS.filter((metric) => availableMetrics.includes(metric))),
    );
  }, [availableMetrics]);

  return {
    selectedMetrics,
    orderedSelectedMetrics,
    normalizeShapes,
    setNormalizeShapes,
    toggleMetric,
    resetSelection,
  };
}
