import { useEffect, useMemo, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { useStore } from '../hooks/StoreContext';
import { useExactUser } from '../hooks/useExactUser';
import { useChartMetricFade } from '../hooks/useChartMetricFade';
import { useChartTabKeyboard } from '../hooks/useChartTabKeyboard';
import { buildChartSeries } from '../utils/statsQueries';
import { applyChartAccentColor, buildLineChartConfig } from '../utils/chartConfig';
import { getVolumeChartMetric, isVolumeConversionActive } from '../utils/volumeConversion';
import { buildChartDescription } from '../utils/a11yDescriptions';
import FadeSection from './FadeSection';
import type { DataProps, ChartMetric } from '../types';

const METRIC_TABS: Array<{ id: ChartMetric; label: string; hideForUser?: boolean }> = [
  { id: 'time', label: 'Time' },
  { id: 'participants', label: 'Participants', hideForUser: true },
  { id: 'characters', label: 'Characters' },
  { id: 'pages', label: 'Pages' },
  { id: 'sources', label: 'Sources' },
];

const CHART_PANEL_ID = 'history-chart-panel';

export default function StatsChart({ allStats, allUsers }: DataProps) {
  const { currentAccentColor, excludedMarathons, filterTotals, volumeConversion } = useStore();
  const { exactUsername, isExactMatch, isPartialSearch } = useExactUser(allUsers);
  const {
    activeTab,
    chartMetric,
    fadeState,
    requestMetricChange,
    handleFadeEnd,
    resetToTimeMetric,
    switchToMetric,
    resetChartFade,
  } = useChartMetricFade();

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart<'line'> | null>(null);
  const wasPartialSearchRef = useRef(false);
  const volumeActive = isVolumeConversionActive(volumeConversion, isExactMatch);

  useEffect(() => {
    if (isExactMatch && activeTab === 'participants') {
      resetToTimeMetric();
    }
  }, [isExactMatch, activeTab, resetToTimeMetric]);

  useEffect(() => {
    if (!volumeActive) return;

    const volumeMetric = getVolumeChartMetric(volumeConversion);
    if (activeTab === 'pages' || activeTab === 'characters') {
      if (activeTab !== volumeMetric) {
        switchToMetric(volumeMetric);
      }
    }
  }, [volumeActive, volumeConversion, activeTab, switchToMetric]);

  useEffect(() => {
    if (wasPartialSearchRef.current && !isPartialSearch) {
      resetChartFade();
    }
    wasPartialSearchRef.current = isPartialSearch;
  }, [isPartialSearch, resetChartFade]);

  const visibleTabs = useMemo(() => {
    return METRIC_TABS.filter((tab) => {
      if (tab.hideForUser && isExactMatch) return false;
      if (!volumeActive) return true;
      if (tab.id === 'pages' || tab.id === 'characters') {
        return tab.id === getVolumeChartMetric(volumeConversion);
      }
      return true;
    });
  }, [isExactMatch, volumeActive, volumeConversion]);

  const chartSeries = useMemo(
    () =>
      buildChartSeries(allStats, chartMetric, {
        username: exactUsername,
        filterTotals,
        excludedMarathons,
        volumeConversion: volumeActive ? volumeConversion : undefined,
      }),
    [
      allStats,
      chartMetric,
      exactUsername,
      filterTotals,
      excludedMarathons,
      volumeActive,
      volumeConversion,
    ],
  );

  const hasChartData = chartSeries.labels.length > 0;

  const activeTabLabel = visibleTabs.find((tab) => tab.id === activeTab)?.label ?? activeTab;
  const chartDescription = useMemo(
    () => buildChartDescription(activeTabLabel, chartSeries.labels, chartSeries.values),
    [activeTabLabel, chartSeries.labels, chartSeries.values],
  );

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas || !hasChartData) {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    const chartConfig = buildLineChartConfig(chartSeries, chartMetric, currentAccentColor);
    const existingChart = chartInstanceRef.current;

    if (!existingChart || existingChart.canvas !== canvas) {
      existingChart?.destroy();
      chartInstanceRef.current = new Chart(context, chartConfig);
      return;
    }

    existingChart.data.labels = chartSeries.labels;
    existingChart.data.datasets[0].data = chartSeries.values;
    existingChart.data.datasets[0].label = chartMetric.toUpperCase();

    const yAxisTitle = existingChart.options.scales?.y?.title;
    if (yAxisTitle && typeof yAxisTitle === 'object') {
      yAxisTitle.text = chartMetric.toUpperCase();
    }

    const yAxisTicks = existingChart.options.scales?.y?.ticks;
    if (yAxisTicks && typeof yAxisTicks === 'object') {
      yAxisTicks.callback = chartConfig.options?.scales?.y?.ticks?.callback;
    }

    applyChartAccentColor(existingChart, currentAccentColor);
    existingChart.update('none');
  }, [chartSeries, chartMetric, currentAccentColor, hasChartData]);

  useEffect(
    () => () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    },
    [],
  );

  const handleTabKeyDown = useChartTabKeyboard(
    visibleTabs.map((tab) => tab.id),
    activeTab,
    requestMetricChange,
  );

  if (!hasChartData) return null;

  return (
    <FadeSection
      show={!isPartialSearch}
      as="section"
      id="chart-section"
      className="chart-section"
      aria-label="Marathon history chart"
    >
      <div
        className="chart-controls"
        role="tablist"
        aria-label="Chart metric"
        tabIndex={-1}
        onKeyDown={handleTabKeyDown}
      >
        {visibleTabs.map((tab) => {
          const tabId = `chart-tab-${tab.id}`;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              id={tabId}
              role="tab"
              aria-selected={isSelected}
              aria-controls={CHART_PANEL_ID}
              tabIndex={isSelected ? 0 : -1}
              className={`chart-tab ${isSelected ? 'active' : ''}`}
              onClick={() => requestMetricChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id={CHART_PANEL_ID}
        role="tabpanel"
        aria-labelledby={`chart-tab-${activeTab}`}
        className={`chart-container ${fadeState === 'hidden' ? 'chart-fade-hidden' : ''}`}
        onTransitionEnd={handleFadeEnd}
      >
        <p className="sr-only" id="chart-description">
          {chartDescription}
        </p>
        <canvas ref={chartRef} id="historyChart" role="img" aria-labelledby="chart-description" />
      </div>
    </FadeSection>
  );
}
