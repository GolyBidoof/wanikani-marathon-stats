import { useLayoutEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { buildLineChartConfig, updateLineChart } from '../utils/chartConfig';
import type { ChartSeriesData } from '../utils/chartConfig';
import type { ChartMetric } from '../types';

const MAX_LAYOUT_RETRIES = 8;

interface UseHistoryChartOptions {
  scope: string;
  series: ChartSeriesData;
  metric: ChartMetric;
  accentColor: string;
  enabled: boolean;
}

export function useHistoryChart({
  scope,
  series,
  metric,
  accentColor,
  enabled,
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
        chartRef.current = new Chart(context, buildLineChartConfig(series, metric, accentColor));
        scopeRef.current = scope;
      } else {
        updateLineChart(existingChart, series, metric, accentColor);
      }

      chartRef.current.resize();
      chartRef.current.update('none');
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
  }, [scope, series, metric, accentColor, enabled]);

  return { containerRef, canvasRef };
}
