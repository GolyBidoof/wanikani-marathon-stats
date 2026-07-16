import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../hooks/StoreContext';
import { useExactUser } from '../hooks/useExactUser';
import { useChartMetricSelection } from '../hooks/useChartMetricSelection';
import { useChartMetricToggleKeyboard } from '../hooks/useChartMetricToggleKeyboard';
import { useHistoryChart } from '../hooks/useHistoryChart';
import { buildMultiChartSeries } from '../utils/statsQueries';
import { buildMultiChartDescription } from '../utils/a11yDescriptions';
import { chartMetricColor, getChartMetricLabel } from '../utils/chartConfig';
import { isVolumeConversionActive } from '../utils/volumeConversion';
import FadeSection from './FadeSection';
import type { DataProps, ChartMetric } from '../types';
import type { MultiChartSeriesData } from '../utils/chartConfig';

const METRIC_OPTIONS: Array<{
  id: ChartMetric;
  hideForUser?: boolean;
  /** Combined: only for a selected user while volume conversion is on. */
  requiresUserVolume?: boolean;
}> = [
  { id: 'time' },
  { id: 'participants', hideForUser: true },
  { id: 'characters' },
  { id: 'pages' },
  { id: 'volume', requiresUserVolume: true },
  { id: 'sources' },
];

function ChartCanvas({
  series,
  scope,
  enabled,
  volumeDisplayAs,
  descriptionId,
  canvasId,
  className,
}: {
  series: MultiChartSeriesData;
  scope: string;
  enabled: boolean;
  volumeDisplayAs: 'pages' | 'chars';
  descriptionId: string;
  canvasId: string;
  className?: string;
}) {
  const { containerRef, canvasRef } = useHistoryChart({
    scope,
    series,
    enabled,
    volumeDisplayAs,
  });
  const { t } = useTranslation();
  const description = buildMultiChartDescription(series);

  return (
    <div ref={containerRef} className={className} role="region" aria-label={t('chart.canvasLabel')}>
      <p className="sr-only" id={descriptionId}>
        {description}
      </p>
      <canvas
        ref={canvasRef}
        key={scope}
        id={canvasId}
        role="img"
        aria-labelledby={descriptionId}
      />
    </div>
  );
}

export default function StatsChart({ allStats, allUsers }: DataProps) {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const { currentAccentColor, excludedMarathons, filterTotals, volumeConversion } = useStore();
  const { exactUsername, isExactMatch, isPartialSearch } = useExactUser(allUsers);
  const volumeActive = isVolumeConversionActive(volumeConversion, isExactMatch);
  const [isExpanded, setIsExpanded] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const availableMetrics = useMemo(
    () =>
      METRIC_OPTIONS.filter((option) => {
        if (option.hideForUser && isExactMatch) return false;
        if (option.requiresUserVolume && !volumeActive) return false;
        return true;
      }).map((option) => option.id),
    [isExactMatch, volumeActive],
  );

  const {
    selectedMetrics,
    orderedSelectedMetrics,
    normalizeShapes,
    setNormalizeShapes,
    toggleMetric,
    resetSelection,
  } = useChartMetricSelection(availableMetrics);

  const previousUsernameRef = useRef(exactUsername);

  useEffect(() => {
    if (previousUsernameRef.current === exactUsername) return;
    previousUsernameRef.current = exactUsername;
    resetSelection();
  }, [exactUsername, resetSelection]);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isExpanded]);

  const chartSeries = useMemo(
    () =>
      buildMultiChartSeries(allStats, orderedSelectedMetrics, {
        username: exactUsername,
        filterTotals,
        excludedMarathons,
        volumeConversion: volumeActive ? volumeConversion : undefined,
        volumeDisplayAs: volumeConversion.displayAs,
        accentColor: currentAccentColor,
        normalized: normalizeShapes,
        language,
      }),
    [
      allStats,
      orderedSelectedMetrics,
      exactUsername,
      filterTotals,
      excludedMarathons,
      volumeActive,
      volumeConversion,
      currentAccentColor,
      normalizeShapes,
      language,
    ],
  );

  const hasChartData = chartSeries.labels.length > 0 && chartSeries.datasets.length > 0;
  const chartScope = `${exactUsername || 'community'}:${orderedSelectedMetrics.join(',')}:${normalizeShapes ? 'norm' : 'abs'}:${language}`;
  const handleMetricKeyDown = useChartMetricToggleKeyboard(availableMetrics, toggleMetric);

  if (!hasChartData) return null;

  const metricToolbar = (idPrefix: string) => (
    <div
      className="chart-controls"
      role="toolbar"
      aria-label={t('chart.metricsLabel')}
      onKeyDown={handleMetricKeyDown}
    >
      {availableMetrics.map((metric) => {
        const isSelected = selectedMetrics.has(metric);
        const color = chartMetricColor(metric, currentAccentColor);

        return (
          <button
            key={`${idPrefix}-${metric}`}
            type="button"
            id={`${idPrefix}-metric-${metric}`}
            aria-pressed={isSelected}
            className={`chart-metric-toggle ${isSelected ? 'active' : ''}`}
            style={
              {
                '--metric-color': color,
              } as CSSProperties
            }
            onClick={() => toggleMetric(metric)}
          >
            <span className="chart-metric-swatch" aria-hidden="true" />
            {getChartMetricLabel(metric, language)}
          </button>
        );
      })}
    </div>
  );

  return (
    <FadeSection
      show={!isPartialSearch}
      as="section"
      id="chart-section"
      className="chart-section"
      aria-label={t('chart.sectionLabel')}
    >
      <div className="chart-toolbar">
        {metricToolbar('chart')}

        <div className="chart-toolbar-actions">
          <label className="chart-normalize-toggle">
            <input
              type="checkbox"
              checked={normalizeShapes}
              onChange={(event) => setNormalizeShapes(event.target.checked)}
            />
            <span>{t('chart.compareShapes')}</span>
          </label>
          <button
            type="button"
            className="chart-expand-btn"
            onClick={() => setIsExpanded(true)}
            aria-haspopup="dialog"
          >
            {t('chart.expand')}
          </button>
        </div>
      </div>

      <p className="chart-hint">
        {normalizeShapes ? t('chart.normalizedHint') : t('chart.defaultHint')}
      </p>

      <ChartCanvas
        series={chartSeries}
        scope={chartScope}
        enabled={!isPartialSearch && !isExpanded}
        volumeDisplayAs={volumeConversion.displayAs}
        descriptionId="chart-description"
        canvasId="historyChart"
        className="chart-container"
      />

      {isExpanded &&
        createPortal(
          <div
            className="chart-expand-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsExpanded(false);
            }}
          >
            <div
              className="chart-expand-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="chart-expand-header">
                <h2 id={titleId}>{t('chart.dialogTitle')}</h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="chart-expand-close"
                  onClick={() => setIsExpanded(false)}
                >
                  {t('chart.close')}
                </button>
              </div>

              <div className="chart-expand-toolbar">
                {metricToolbar('chart-expanded')}
                <label className="chart-normalize-toggle">
                  <input
                    type="checkbox"
                    checked={normalizeShapes}
                    onChange={(event) => setNormalizeShapes(event.target.checked)}
                  />
                  <span>{t('chart.compareShapes')}</span>
                </label>
              </div>

              <ChartCanvas
                series={chartSeries}
                scope={`expanded:${chartScope}`}
                enabled
                volumeDisplayAs={volumeConversion.displayAs}
                descriptionId="chart-description-expanded"
                canvasId="historyChartExpanded"
                className="chart-container chart-container-expanded"
              />
            </div>
          </div>,
          document.body,
        )}
    </FadeSection>
  );
}
