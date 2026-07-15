import { describe, expect, it, vi } from 'vitest';
import { updateLineChart } from './chartConfig';

describe('updateLineChart', () => {
  it('updates tooltip callbacks when the metric changes', () => {
    const chart = {
      data: {
        labels: ['Spring 2025'],
        datasets: [{ data: [12], label: 'TIME' }],
      },
      options: {
        scales: {
          y: {
            title: { text: 'TIME' },
            ticks: { callback: () => 'old' },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: () => 'Time: 12h',
            },
          },
        },
      },
      update: vi.fn(),
      getDatasetMeta: () => ({ data: [] }),
    };

    updateLineChart(
      chart as never,
      { labels: ['Spring 2025'], values: [5000] },
      'characters',
      '#ff00aa',
    );

    expect(chart.data.datasets[0].label).toBe('CHARACTERS');
    expect(chart.options.scales.y.title.text).toBe('CHARACTERS');
    const label = chart.options.plugins.tooltip.callbacks.label as (context: {
      parsed: { y: number };
    }) => string;
    expect(label({ parsed: { y: 5000 } })).toBe('Characters: 5,000');
    expect(chart.update).toHaveBeenCalledWith('none');
  });
});
