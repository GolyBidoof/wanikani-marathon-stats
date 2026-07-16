import { useLayoutEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { buildLineChartConfig, updateLineChart } from '../utils/chartConfig';
import type { MultiChartSeriesData } from '../utils/chartConfig';
import type { VolumeDisplayUnit } from '../types';

const MAX_LAYOUT_RETRIES = 8;

interface UseHistoryChartOptions {
  scope: string;
  series: MultiChartSeriesData;
  enabled: boolean;
  volumeDisplayAs?: VolumeDisplayUnit;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useHistoryChart({
  scope,
  series,
  enabled,
  volumeDisplayAs = 'chars',
}: UseHistoryChartOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'line'> | null>(null);
  const scopeRef = useRef('');

  useLayoutEffect(() => {
    if (!enabled) {
      chartRef.current?.destroy();
      chartRef.current = null;
      scopeRef.current = '';
      return;
    }

    let retryFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;
    const reducedMotion = prefersReducedMotion();

    const destroyChart = () => {
      chartRef.current?.destroy();
      chartRef.current = null;
      scopeRef.current = '';
    };

    const syncChart = () => {
      if (cancelled) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas || container.clientWidth === 0 || container.clientHeight === 0) {
        if (retryFrame < MAX_LAYOUT_RETRIES) {
          retryFrame += 1;
          requestAnimationFrame(syncChart);
        }
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) return;

      const existingChart = chartRef.current;
      const needsNewChart =
        !existingChart || existingChart.canvas !== canvas || scopeRef.current !== scope;

      if (needsNewChart) {
        existingChart?.destroy();
        chartRef.current = new Chart(
          context,
          buildLineChartConfig(series, reducedMotion, volumeDisplayAs),
        );
        scopeRef.current = scope;
      } else {
        updateLineChart(existingChart, series, reducedMotion, volumeDisplayAs);
      }

      const chart = chartRef.current;
      if (!chart) return;

      chart.resize();
      chart.update(reducedMotion ? 'none' : undefined);
    };

    syncChart();

    const container = containerRef.current;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (!chartRef.current) {
          syncChart();
          return;
        }

        chartRef.current.resize();
        chartRef.current.update('none');
      });
      resizeObserver.observe(container);
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      destroyChart();
    };
  }, [scope, series, enabled, volumeDisplayAs]);

  return { containerRef, canvasRef };
}
