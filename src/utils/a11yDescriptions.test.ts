import { describe, expect, it } from 'vitest';
import {
  buildAchievementCardDescription,
  buildChartDescription,
  buildMultiChartDescription,
} from './a11yDescriptions';
import type { SummaryDrawContext } from './drawSummaryCard';
import type { MultiChartSeriesData } from './chartConfig';

describe('buildChartDescription', () => {
  it('reads metric points aloud for screen readers', () => {
    expect(buildChartDescription('Time', ['Summer 2025', 'Winter 2025'], [1.5, 2])).toBe(
      'Line chart of Time across 2 marathons. Summer 2025: 1.5. Winter 2025: 2.',
    );
  });

  it('handles empty series', () => {
    expect(buildChartDescription('Pages', [], [])).toBe(
      'Chart showing Pages across marathons. No data available.',
    );
  });
});

describe('buildMultiChartDescription', () => {
  it('summarizes multiple metrics and normalization mode', () => {
    const series: MultiChartSeriesData = {
      labels: ['Summer 2025', 'Winter 2025'],
      normalized: true,
      datasets: [
        {
          metric: 'pages',
          label: 'Pages',
          rawValues: [10, 20],
          values: [100, 200],
          color: '#00aaff',
          axisId: 'axis-normalized',
          axisFamily: 'normalized',
        },
      ],
    };

    expect(buildMultiChartDescription(series)).toContain('normalized');
    expect(buildMultiChartDescription(series)).toContain('Pages');
    expect(buildMultiChartDescription(series)).toContain('100%');
  });
});

describe('buildAchievementCardDescription', () => {
  it('describes a user achievement card including Japanese mode', () => {
    const drawContext = {
      state: {
        name: 'Alice',
        count: 2,
        pages: 30,
        chars: 3000,
        sources: 3,
        time: 3.5,
        history: ['Summer 2025', 'Winter 2025'],
      },
      currentQuery: 'Alice',
      cardLanguage: 'ja',
      volumeConversion: { enabled: false, displayAs: 'chars', charsPerPage: 300 },
    } as SummaryDrawContext;

    expect(buildAchievementCardDescription(drawContext)).toContain(
      "Achievement card for Alice's readathon statistics",
    );
    expect(buildAchievementCardDescription(drawContext)).toContain('Card displayed in Japanese.');
    expect(buildAchievementCardDescription(drawContext)).toContain('Marathon history includes 2');
  });
});
