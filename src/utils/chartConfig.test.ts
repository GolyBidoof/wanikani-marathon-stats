import { describe, expect, it, vi } from 'vitest';
import {
  buildLineChartConfig,
  chartMetricColor,
  normalizeSeriesValues,
  updateLineChart,
  type MultiChartSeriesData,
} from './chartConfig';

function sampleSeries(normalized = false): MultiChartSeriesData {
  return {
    labels: ['Spring 2025', 'Summer 2025'],
    normalized,
    datasets: [
      {
        metric: 'pages',
        label: 'Pages',
        rawValues: [10, 20],
        values: normalized ? [100, 200] : [10, 20],
        color: '#00aaff',
        axisId: normalized ? 'axis-normalized' : 'axis-pages',
        axisFamily: normalized ? 'normalized' : 'pages',
      },
      {
        metric: 'characters',
        label: 'Characters',
        rawValues: [1000, 2000],
        values: normalized ? [100, 200] : [1000, 2000],
        color: '#a100ff',
        axisId: normalized ? 'axis-normalized' : 'axis-characters',
        axisFamily: normalized ? 'normalized' : 'characters',
      },
    ],
  };
}

describe('chartConfig', () => {
  it('builds multiple datasets on separate axes', () => {
    const config = buildLineChartConfig(sampleSeries(false), true);
    expect(config.data.datasets).toHaveLength(2);
    expect(config.data.datasets[0].yAxisID).toBe('axis-pages');
    expect(config.data.datasets[1].yAxisID).toBe('axis-characters');
    expect(config.options?.scales?.['axis-pages']).toBeTruthy();
    expect(config.options?.scales?.['axis-characters']).toBeTruthy();
  });

  it('uses a shared normalized axis in compare-shapes mode', () => {
    const config = buildLineChartConfig(sampleSeries(true), true);
    expect(config.data.datasets.every((dataset) => dataset.yAxisID === 'axis-normalized')).toBe(
      true,
    );
  });

  it('normalizes series against the first non-zero point', () => {
    expect(normalizeSeriesValues([50, 100, 25])).toEqual([100, 200, 50]);
    expect(normalizeSeriesValues([0, 0])).toEqual([0, 0]);
  });

  it('updates chart data and tooltip callbacks for multi-series', () => {
    const chart = {
      data: {
        labels: ['Spring 2025'],
        datasets: [{ data: [12], label: 'TIME' }],
      },
      options: {
        scales: {},
        plugins: {
          tooltip: {
            callbacks: {
              label: () => '',
            },
          },
        },
        animation: false as const,
      },
      update: vi.fn(),
    };

    updateLineChart(chart as never, sampleSeries(false), true);

    expect(chart.data.datasets).toHaveLength(2);
    expect(chart.data.datasets[0].label).toBe('Pages');
    const label = chart.options.plugins.tooltip.callbacks.label as (context: {
      datasetIndex: number;
      dataIndex: number;
      parsed: { y: number };
    }) => string;
    expect(label({ datasetIndex: 1, dataIndex: 1, parsed: { y: 2000 } })).toBe('Characters: 2,000');
    expect(chart.update).toHaveBeenCalledWith('none');
  });

  it('gives volume its own axis separate from pages and characters', () => {
    const series: MultiChartSeriesData = {
      labels: ['Spring 2025'],
      normalized: false,
      datasets: [
        {
          metric: 'pages',
          label: 'Pages',
          rawValues: [10],
          values: [10],
          color: '#4CC9F0',
          axisId: 'axis-pages',
          axisFamily: 'pages',
        },
        {
          metric: 'volume',
          label: 'Volume',
          rawValues: [100],
          values: [100],
          color: '#06D6A0',
          axisId: 'axis-volume',
          axisFamily: 'volume',
        },
        {
          metric: 'characters',
          label: 'Characters',
          rawValues: [1000],
          values: [1000],
          color: '#F72585',
          axisId: 'axis-characters',
          axisFamily: 'characters',
        },
      ],
    };

    const config = buildLineChartConfig(series, true, 'chars');
    expect(config.options?.scales?.['axis-pages']).toBeTruthy();
    expect(config.options?.scales?.['axis-volume']).toBeTruthy();
    expect(config.options?.scales?.['axis-characters']).toBeTruthy();
    expect(config.options?.scales?.['axis-volume']?.title).toMatchObject({
      text: 'COMBINED (chars)',
      color: '#06D6A0',
    });
  });

  it('keeps all y-axis zeros pinned to the chart baseline', () => {
    const series: MultiChartSeriesData = {
      labels: ['Spring 2025'],
      normalized: false,
      datasets: [
        {
          metric: 'time',
          label: 'Time',
          rawValues: [2],
          values: [2],
          color: '#ff6600',
          axisId: 'axis-time',
          axisFamily: 'time',
        },
        {
          metric: 'pages',
          label: 'Pages',
          rawValues: [10],
          values: [10],
          color: '#4CC9F0',
          axisId: 'axis-pages',
          axisFamily: 'pages',
        },
        {
          metric: 'volume',
          label: 'Combined',
          rawValues: [100],
          values: [100],
          color: '#06D6A0',
          axisId: 'axis-volume',
          axisFamily: 'volume',
        },
      ],
    };

    const config = buildLineChartConfig(series, true, 'chars');
    for (const axisId of ['axis-time', 'axis-pages', 'axis-volume']) {
      const scale = config.options?.scales?.[axisId];
      expect(scale).toMatchObject({ min: 0, beginAtZero: true });
      expect(scale && 'offset' in scale ? scale.offset : false).toBeFalsy();
    }
  });

  it('keeps time on a fixed palette color instead of the accent', () => {
    expect(chartMetricColor('time', '#ffb800')).toBe('#A78BFA');
    expect(chartMetricColor('time', '#ff00aa')).toBe('#A78BFA');
  });
});
