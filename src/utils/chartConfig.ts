import type { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js/auto';
import { formatHours } from './helpers';
import type { ChartMetric } from '../types';

export interface ChartSeriesData {
  labels: string[];
  values: number[];
}

export function buildLineChartConfig(
  series: ChartSeriesData,
  metric: ChartMetric,
  accentColor: string,
): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data: {
      labels: series.labels,
      datasets: [
        {
          label: metric.toUpperCase(),
          data: series.values,
          borderColor: accentColor,
          backgroundColor: `${accentColor}1a`,
          borderWidth: 3,
          tension: 0.3,
          pointBackgroundColor: accentColor,
          pointBorderColor: accentColor,
          pointHoverBackgroundColor: accentColor,
          pointHoverBorderColor: accentColor,
          pointRadius: 5,
          pointHitRadius: 15,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          title: { display: true, text: metric.toUpperCase(), color: '#919191' },
          ticks: {
            color: '#919191',
            precision: 0,
            callback: (value) => formatYAxisTick(metric, value),
          },
        },
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          title: { display: true, text: 'MARATHON', color: '#919191' },
          ticks: { color: '#919191' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'line'>) =>
              formatTooltipLabel(metric, context.parsed.y ?? 0),
          },
        },
      },
    } as ChartOptions<'line'>,
  };
}

function formatYAxisTick(metric: ChartMetric, value: string | number): string {
  if (metric === 'time') return `${Math.floor(Number(value))}h`;
  return Number(value).toLocaleString();
}

function formatTooltipLabel(metric: ChartMetric, value: number): string {
  if (metric === 'time') return `Time: ${formatHours(value)}`;
  if (metric === 'characters') return `Characters: ${value.toLocaleString()}`;
  if (metric === 'pages') return `Pages: ${value.toLocaleString()}`;
  if (metric === 'sources') return `Sources: ${value.toLocaleString()}`;
  if (metric === 'participants') return `Participants: ${value.toLocaleString()}`;
  return String(value);
}

export function updateLineChart(
  chart: import('chart.js/auto').Chart<'line'>,
  series: ChartSeriesData,
  metric: ChartMetric,
  accentColor: string,
) {
  const dataset = chart.data.datasets[0];
  chart.data.labels = series.labels;
  dataset.data = series.values;
  dataset.label = metric.toUpperCase();

  const yScale = chart.options.scales?.y;
  if (yScale && typeof yScale === 'object') {
    if (yScale.title && typeof yScale.title === 'object') {
      yScale.title.text = metric.toUpperCase();
    }
    if (yScale.ticks && typeof yScale.ticks === 'object') {
      yScale.ticks.callback = (value) => formatYAxisTick(metric, value);
    }
  }

  if (!chart.options.plugins) chart.options.plugins = {};
  if (!chart.options.plugins.tooltip) chart.options.plugins.tooltip = {};
  chart.options.plugins.tooltip.callbacks = {
    label: (context: TooltipItem<'line'>) => formatTooltipLabel(metric, context.parsed.y ?? 0),
  };

  applyChartAccentColor(chart, accentColor);
  chart.update('none');
}

export function applyChartAccentColor(
  chart: import('chart.js/auto').Chart<'line'>,
  accentColor: string,
) {
  const dataset = chart.data.datasets[0] as {
    borderColor: string;
    backgroundColor: string;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointHoverBackgroundColor: string;
    pointHoverBorderColor: string;
  };

  dataset.borderColor = accentColor;
  dataset.backgroundColor = `${accentColor}1a`;
  dataset.pointBackgroundColor = accentColor;
  dataset.pointBorderColor = accentColor;
  dataset.pointHoverBackgroundColor = accentColor;
  dataset.pointHoverBorderColor = accentColor;

  const meta = chart.getDatasetMeta(0);
  for (const point of meta.data) {
    const pointOptions = (point as { options?: Record<string, string> }).options;
    if (!pointOptions) continue;
    pointOptions.backgroundColor = accentColor;
    pointOptions.borderColor = accentColor;
    pointOptions.hoverBackgroundColor = accentColor;
    pointOptions.hoverBorderColor = accentColor;
  }
}
