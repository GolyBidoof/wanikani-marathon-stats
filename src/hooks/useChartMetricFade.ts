import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react';
import type { ChartMetric } from '../types';

const FADE_DURATION_MS = 250;

type FadeState = 'visible' | 'hidden';

export function useChartMetricFade() {
  const [activeTab, setActiveTab] = useState<ChartMetric>('time');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('time');
  const [fadeState, setFadeState] = useState<FadeState>('visible');
  const pendingMetricRef = useRef<ChartMetric | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishMetricChange = useCallback(() => {
    if (!pendingMetricRef.current) return;

    const nextMetric = pendingMetricRef.current;
    pendingMetricRef.current = null;
    setChartMetric(nextMetric);
    requestAnimationFrame(() => setFadeState('visible'));
  }, []);

  const requestMetricChange = useCallback(
    (metric: ChartMetric) => {
      if (metric === activeTab) return;

      setActiveTab(metric);
      pendingMetricRef.current = metric;
      if (fadeState === 'hidden') return;

      setFadeState('hidden');
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

      fadeTimeoutRef.current = setTimeout(() => {
        fadeTimeoutRef.current = null;
        finishMetricChange();
      }, FADE_DURATION_MS);
    },
    [activeTab, fadeState, finishMetricChange],
  );

  const handleFadeEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== 'opacity' || fadeState !== 'hidden' || !pendingMetricRef.current)
        return;

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }

      finishMetricChange();
    },
    [fadeState, finishMetricChange],
  );

  const resetChartFade = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (pendingMetricRef.current) {
      setChartMetric(pendingMetricRef.current);
      pendingMetricRef.current = null;
    }

    setFadeState('visible');
  }, []);

  const resetToTimeMetric = useCallback(() => {
    setActiveTab('time');
    setChartMetric('time');
    setFadeState('visible');
    pendingMetricRef.current = null;
  }, []);

  const switchToMetric = useCallback((metric: ChartMetric) => {
    setActiveTab(metric);
    setChartMetric(metric);
    setFadeState('visible');
    pendingMetricRef.current = null;
  }, []);

  useEffect(
    () => () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    },
    [],
  );

  return {
    activeTab,
    chartMetric,
    fadeState,
    requestMetricChange,
    handleFadeEnd,
    resetToTimeMetric,
    switchToMetric,
    resetChartFade,
  };
}
