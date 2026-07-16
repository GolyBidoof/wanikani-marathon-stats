import type { ChartConfiguration, ChartDataset, ChartOptions, TooltipItem } from 'chart.js/auto';
import { formatHours } from './helpers';
import type { ChartMetric } from '../types';

export type ChartAxisFamily = 'time' | 'pages' | 'characters' | 'volume' | 'count' | 'normalized';

export interface ChartSeriesData {
  labels: string[];
  values: number[];
}

export interface ChartDatasetSeries {
  metric: ChartMetric;
  label: string;
  values: number[];
  rawValues: number[];
  color: string;
  axisId: string;
  axisFamily: ChartAxisFamily;
}

export interface MultiChartSeriesData {
  labels: string[];
  datasets: ChartDatasetSeries[];
  normalized: boolean;
}

export const CHART_METRIC_LABELS: Record<ChartMetric, string> = {
  time: 'Time',
  participants: 'Participants',
  characters: 'Characters',
  pages: 'Pages',
  sources: 'Sources',
  volume: 'Combined',
};

const HIGH_CONTRAST_METRIC_COLORS: Record<ChartMetric, string> = {
  time: '#A78BFA',
  participants: '#FF6B35',
  characters: '#F72585',
  pages: '#4CC9F0',
  sources: '#FFD166',
  volume: '#06D6A0',
};

const ACCENT_NEAR_HUES: Array<{ metric: ChartMetric; fallback: string }> = [
  { metric: 'time', fallback: '#C4B5FD' },
  { metric: 'pages', fallback: '#90E0EF' },
  { metric: 'characters', fallback: '#FF85A1' },
  { metric: 'volume', fallback: '#80ED99' },
  { metric: 'sources', fallback: '#FFE66D' },
  { metric: 'participants', fallback: '#FF9E6D' },
];

function hexToRgb(hexColor: string): [number, number, number] | null {
  const hex = hexColor.replace('#', '');
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function colorDistance(left: string, right: string): number {
  const a = hexToRgb(left);
  const b = hexToRgb(right);
  if (!a || !b) return 255;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function chartMetricColor(metric: ChartMetric, accentColor: string): string {
  let color = HIGH_CONTRAST_METRIC_COLORS[metric];
  if (colorDistance(color, accentColor) < 90) {
    const fallback = ACCENT_NEAR_HUES.find((entry) => entry.metric === metric)?.fallback;
    if (fallback) color = fallback;
  }
  return color;
}

export function axisFamilyForMetric(metric: ChartMetric): ChartAxisFamily {
  if (metric === 'time') return 'time';
  if (metric === 'pages') return 'pages';
  if (metric === 'characters') return 'characters';
  if (metric === 'volume') return 'volume';
  return 'count';
}

export function axisIdForFamily(family: ChartAxisFamily): string {
  return `axis-${family}`;
}

function axisTitleForFamily(family: ChartAxisFamily, volumeDisplayAs: 'pages' | 'chars'): string {
  if (family === 'normalized') return '% OF FIRST';
  if (family === 'time') return 'TIME (h)';
  if (family === 'pages') return 'PAGES';
  if (family === 'characters') return 'CHARS';
  if (family === 'volume') {
    return volumeDisplayAs === 'pages' ? 'COMBINED (pgs)' : 'COMBINED (chars)';
  }
  return 'COUNT';
}

function formatAxisTick(family: ChartAxisFamily, value: string | number): string {
  const numericValue = Number(value);
  if (family === 'normalized') return `${Math.round(numericValue)}%`;
  if (family === 'time') return `${Math.floor(numericValue)}h`;
  if (numericValue >= 1000) {
    return `${Math.round(numericValue / 100) / 10}k`;
  }
  return numericValue.toLocaleString();
}

function formatTooltipLabel(
  metric: ChartMetric,
  value: number,
  normalized: boolean,
  rawValue?: number,
): string {
  const label = CHART_METRIC_LABELS[metric];
  if (normalized) {
    const rawSuffix =
      rawValue == null
        ? ''
        : metric === 'time'
          ? ` (${formatHours(rawValue)})`
          : ` (${rawValue.toLocaleString()})`;
    return `${label}: ${Math.round(value)}%${rawSuffix}`;
  }
  if (metric === 'time') return `${label}: ${formatHours(value)}`;
  return `${label}: ${value.toLocaleString()}`;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return `rgba(168, 168, 168, ${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function buildScaleOptions(
  series: MultiChartSeriesData,
  familiesInUse: ChartAxisFamily[],
  volumeDisplayAs: 'pages' | 'chars',
): NonNullable<ChartOptions<'line'>['scales']> {
  const scales: NonNullable<ChartOptions<'line'>['scales']> = {
    x: {
      grid: { color: 'rgba(255, 255, 255, 0.06)' },
      title: { display: true, text: 'MARATHON', color: '#a8a8a8' },
      ticks: { color: '#a8a8a8', maxRotation: 0, autoSkip: true },
      border: { color: 'rgba(255, 255, 255, 0.08)' },
    },
  };

  familiesInUse.forEach((family, index) => {
    const axisId = axisIdForFamily(family);
    const position = index % 2 === 0 ? 'left' : 'right';
    const sameSideIndex = Math.floor(index / 2);
    const familyDatasets = series.datasets.filter((dataset) => dataset.axisFamily === family);
    const axisColor =
      familyDatasets.length === 1
        ? familyDatasets[0]!.color
        : familyDatasets[0]?.color || '#a8a8a8';

    scales[axisId] = {
      type: 'linear',
      position,
      min: 0,
      beginAtZero: true,
      weight: Math.max(1, 4 - sameSideIndex),
      grid: {
        drawOnChartArea: index === 0,
        color: hexToRgba(axisColor, 0.1),
      },
      border: { display: true, color: axisColor, width: 2 },
      title: {
        display: true,
        text: axisTitleForFamily(family, volumeDisplayAs),
        color: axisColor,
        font: { weight: 700, size: 11 },
      },
      ticks: {
        color: axisColor,
        maxTicksLimit: familiesInUse.length >= 4 ? 4 : 5,
        precision: family === 'normalized' || family === 'time' ? 0 : undefined,
        callback: (value) => formatAxisTick(family, value),
      },
    };
  });

  return scales;
}

function toChartDatasets(series: MultiChartSeriesData): ChartDataset<'line', number[]>[] {
  const dashPatterns: Array<number[] | undefined> = [
    undefined,
    [6, 4],
    [2, 3],
    [8, 3, 2, 3],
    [1, 2],
    [10, 4],
  ];

  return series.datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.values,
    yAxisID: dataset.axisId,
    borderColor: dataset.color,
    backgroundColor: hexToRgba(dataset.color, series.datasets.length > 3 ? 0.08 : 0.16),
    borderWidth: 3,
    borderDash: dashPatterns[index % dashPatterns.length],
    tension: 0.35,
    fill: series.datasets.length <= 3,
    pointBackgroundColor: dataset.color,
    pointBorderColor: '#121212',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 7,
    pointHitRadius: 16,
    pointHoverBorderWidth: 2,
  }));
}

export function buildLineChartConfig(
  series: MultiChartSeriesData,
  preferReducedMotion = false,
  volumeDisplayAs: 'pages' | 'chars' = 'chars',
): ChartConfiguration<'line'> {
  const familiesInUse = [...new Set(series.datasets.map((dataset) => dataset.axisFamily))];

  return {
    type: 'line',
    data: {
      labels: series.labels,
      datasets: toChartDatasets(series),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: familiesInUse.length > 2 ? 4 : 0,
          right: familiesInUse.length > 2 ? 4 : 0,
        },
      },
      animation: preferReducedMotion
        ? false
        : {
            duration: 420,
            easing: 'easeOutQuart',
          },
      interaction: { mode: 'index', intersect: false },
      scales: buildScaleOptions(series, familiesInUse, volumeDisplayAs),
      plugins: {
        legend: {
          display: series.datasets.length > 1,
          position: 'top',
          align: 'center',
          labels: {
            color: '#d6d6d6',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { size: 12, weight: 600 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(18, 18, 18, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#f0f0f0',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const datasetSeries = series.datasets[context.datasetIndex];
              if (!datasetSeries) return '';
              const pointIndex = context.dataIndex;
              return formatTooltipLabel(
                datasetSeries.metric,
                context.parsed.y ?? 0,
                series.normalized,
                datasetSeries.rawValues[pointIndex],
              );
            },
          },
        },
      },
    } as ChartOptions<'line'>,
  };
}

export function updateLineChart(
  chart: import('chart.js/auto').Chart<'line'>,
  series: MultiChartSeriesData,
  preferReducedMotion = false,
  volumeDisplayAs: 'pages' | 'chars' = 'chars',
) {
  const nextConfig = buildLineChartConfig(series, preferReducedMotion, volumeDisplayAs);
  chart.data.labels = nextConfig.data.labels;
  chart.data.datasets = nextConfig.data.datasets;
  chart.options.scales = nextConfig.options?.scales;
  chart.options.plugins = nextConfig.options?.plugins;
  chart.options.animation = nextConfig.options?.animation;
  chart.options.layout = nextConfig.options?.layout;
  chart.update(preferReducedMotion ? 'none' : undefined);
}

export function normalizeSeriesValues(values: number[]): number[] {
  const baseline = values.find((value) => value !== 0) ?? 0;
  if (baseline === 0) return values.map(() => 0);
  return values.map((value) => (value / baseline) * 100);
}
