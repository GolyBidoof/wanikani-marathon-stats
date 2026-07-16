import { useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../hooks/StoreContext';
import { useCardCustomizerData } from '../hooks/useCardCustomizer';
import { useAchievementCardVisible } from '../hooks/useAchievementCardVisible';
import { seasonEmojis } from '../constants';
import { formatMarathonUiLabel } from '../constants/cardCopy';
import { metricsOrderForConversion } from '../utils/volumeConversion';
import ToggleGroup from './a11y/ToggleGroup';
import FadeSection from './FadeSection';
import type {
  CardLanguage,
  DataProps,
  JaCardNumberStyle,
  MetricName,
  SummaryMetricName,
  VolumeDisplayUnit,
} from '../types';

const METRIC_LABEL_KEYS: Record<MetricName | SummaryMetricName, string> = {
  time: 'customizer.metrics.time',
  pages: 'customizer.metrics.pages',
  chars: 'customizer.metrics.chars',
  sources: 'customizer.metrics.sources',
  volume: 'customizer.metrics.volume',
  avgTime: 'customizer.metrics.avgTime',
};

const CUSTOMIZER_CONTENT_ID = 'customizer-content';

export default function CardCustomizer({
  allStats,
  allUsers,
  expanded,
  onExpandedChange,
}: DataProps & {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const { t } = useTranslation();
  const isCardVisible = useAchievementCardVisible(allStats, allUsers);
  const {
    hasUserControls,
    sortedUserMarathons,
    reorderMetric,
    reorderSummaryMetric,
    reorderMarathon,
    applyQuickSelect,
  } = useCardCustomizerData(allStats, allUsers);

  const {
    currentSortMode,
    setCurrentSortMode,
    enabledMetrics,
    setEnabledMetrics,
    enabledSummaryMetrics,
    toggleSummaryMetric,
    excludedMarathons,
    userMetricsOrder,
    summaryMetricsOrder,
    showHistory,
    setShowHistory,
    filterTotals,
    setFilterTotals,
    toggleMetric,
    toggleMarathon,
    volumeConversion,
    setVolumeConversionEnabled,
    setVolumeDisplayAs,
    setVolumeCharsPerPage,
    cardLanguage,
    cardJaNumberStyle,
    cardRoundNumbers,
    resetAchievementCardSettings,
  } = useStore();

  const headerSummary = useMemo(() => {
    const languageLabel = t(
      cardLanguage === 'ja'
        ? 'customizer.summary.languageJapanese'
        : 'customizer.summary.languageEnglish',
    );
    const numberStyleLabel =
      cardLanguage === 'ja'
        ? cardJaNumberStyle === 'words'
          ? t('customizer.summary.wordStyleNumbers')
          : t('customizer.summary.standardNumerals')
        : null;
    const displayLabel = t(
      cardRoundNumbers ? 'customizer.summary.roundedNumbers' : 'customizer.summary.exactNumbers',
    );
    const volumeLabel =
      hasUserControls && volumeConversion.enabled
        ? t('customizer.summary.combinedPagesAndCharacters')
        : null;

    return [languageLabel, numberStyleLabel, displayLabel, volumeLabel].filter(Boolean).join(' · ');
  }, [
    cardLanguage,
    cardJaNumberStyle,
    cardRoundNumbers,
    hasUserControls,
    volumeConversion.enabled,
    t,
  ]);

  useEffect(() => {
    if (!isCardVisible && expanded) onExpandedChange(false);
  }, [isCardVisible, expanded, onExpandedChange]);

  return (
    <FadeSection
      show={isCardVisible}
      as="section"
      className={`customizer-card ${expanded ? 'expanded' : ''}`}
      aria-label={t('customizer.sectionLabel')}
    >
      <button
        type="button"
        className="customizer-header"
        aria-expanded={expanded}
        aria-controls={CUSTOMIZER_CONTENT_ID}
        aria-label={
          expanded ? undefined : t('customizer.collapsedAriaLabel', { settings: headerSummary })
        }
        onClick={() => onExpandedChange(!expanded)}
      >
        <div className="customizer-header-text">
          <span className="customizer-header-title">{t('customizer.title')}</span>
          {!expanded && (
            <span className="customizer-header-summary" aria-hidden="true">
              {headerSummary}
            </span>
          )}
        </div>
        <svg
          className="chevron-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div id={CUSTOMIZER_CONTENT_ID} className="customizer-content">
          <div className="customizer-section customizer-section-first">
            <h2 className="customizer-section-label">{t('customizer.lookAndLanguage')}</h2>
            <CardFormatSettings showNickname={hasUserControls} />
          </div>

          {hasUserControls && (
            <>
              <div className="customizer-section">
                <h2 className="customizer-section-label">{t('customizer.numbersOnCard')}</h2>
                <p className="customizer-section-hint">{t('customizer.numbersHint')}</p>
                <MetricChecklist
                  label={t('customizer.shownTotals')}
                  ariaLabel={t('customizer.totalsOnCard')}
                  metrics={summaryMetricsOrder}
                  enabledMetrics={enabledSummaryMetrics}
                  volumeConversionEnabled={volumeConversion.enabled}
                  onToggle={toggleSummaryMetric}
                  onReorder={reorderSummaryMetric}
                />
                <VolumeConversionSettings
                  enabled={volumeConversion.enabled}
                  displayAs={volumeConversion.displayAs}
                  charsPerPage={volumeConversion.charsPerPage}
                  onEnabledChange={setVolumeConversionEnabled}
                  onDisplayAsChange={setVolumeDisplayAs}
                  onCharsPerPageChange={setVolumeCharsPerPage}
                />
              </div>

              <div className="customizer-section">
                <h2 className="customizer-section-label">{t('customizer.historySidebar')}</h2>
                <p className="customizer-section-hint">{t('customizer.historyHint')}</p>
                <div className="customizer-controls">
                  <div className="customizer-column">
                    <HistoryOptions
                      showHistory={showHistory}
                      filterTotals={filterTotals}
                      onShowHistoryChange={setShowHistory}
                      onFilterTotalsChange={setFilterTotals}
                      onEnableDefaultMetric={() => setEnabledMetrics(new Set(['time']))}
                      hasEnabledMetrics={enabledMetrics.size > 0}
                    />
                    <SortModeToggle value={currentSortMode} onChange={setCurrentSortMode} />
                    <MetricChecklist
                      label={t('customizer.perMarathonDetails')}
                      ariaLabel={t('customizer.metricsInHistory')}
                      metrics={userMetricsOrder}
                      enabledMetrics={enabledMetrics}
                      volumeConversionEnabled={volumeConversion.enabled}
                      onToggle={toggleMetric}
                      onReorder={reorderMetric}
                    />
                  </div>

                  <div className="customizer-column">
                    <MarathonChecklist
                      marathons={sortedUserMarathons}
                      excludedMarathons={excludedMarathons}
                      cardLanguage={cardLanguage}
                      cardJaNumberStyle={cardJaNumberStyle}
                      onToggle={toggleMarathon}
                      onReorder={reorderMarathon}
                      onQuickSelect={applyQuickSelect}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="customizer-footer">
            <button
              type="button"
              className="customizer-reset-btn"
              onClick={resetAchievementCardSettings}
            >
              {t('customizer.reset')}
            </button>
          </div>
        </div>
      )}
    </FadeSection>
  );
}

function CardFormatSettings({ showNickname }: { showNickname: boolean }) {
  const { t } = useTranslation();
  const {
    cardLanguage,
    setCardLanguage,
    cardJaNumberStyle,
    setCardJaNumberStyle,
    cardRoundNumbers,
    setCardRoundNumbers,
    cardNicknameCase,
    setCardNicknameCase,
  } = useStore();

  return (
    <div className="customizer-format-grid">
      <ToggleGroup
        label={t('customizer.cardLanguage')}
        value={cardLanguage}
        options={[
          { value: 'en', label: t('customizer.languageEnglish') },
          { value: 'ja', label: t('customizer.languageJapanese') },
        ]}
        onChange={setCardLanguage}
      />

      <ToggleGroup
        label={t('customizer.numberDisplay')}
        value={cardRoundNumbers ? 'rounded' : 'exact'}
        options={[
          { value: 'exact', label: t('customizer.exact') },
          { value: 'rounded', label: t('customizer.rounded') },
        ]}
        onChange={(value) => setCardRoundNumbers(value === 'rounded')}
      />

      {cardLanguage === 'ja' && (
        <ToggleGroup
          label={t('customizer.numberStyle')}
          value={cardJaNumberStyle}
          options={[
            { value: 'words', label: t('customizer.words') },
            { value: 'numbers', label: t('customizer.numbers') },
          ]}
          onChange={setCardJaNumberStyle}
        />
      )}

      {showNickname && <NicknameToggle value={cardNicknameCase} onChange={setCardNicknameCase} />}
    </div>
  );
}

function VolumeConversionSettings({
  enabled,
  displayAs,
  charsPerPage,
  onEnabledChange,
  onDisplayAsChange,
  onCharsPerPageChange,
}: {
  enabled: boolean;
  displayAs: VolumeDisplayUnit;
  charsPerPage: number;
  onEnabledChange: (enabled: boolean) => void;
  onDisplayAsChange: (displayAs: VolumeDisplayUnit) => void;
  onCharsPerPageChange: (charsPerPage: number) => void;
}) {
  const { t } = useTranslation();
  const [ratioDraft, setRatioDraft] = useState(String(charsPerPage));
  const ratioInputId = useId();
  const ratioHintId = useId();

  useEffect(() => {
    setRatioDraft(String(charsPerPage));
  }, [charsPerPage]);

  const commitRatio = () => {
    const trimmed = ratioDraft.trim();
    if (!trimmed) {
      setRatioDraft(String(charsPerPage));
      return;
    }

    const parsed = parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRatioDraft(String(charsPerPage));
      return;
    }

    onCharsPerPageChange(parsed);
    setRatioDraft(String(parsed));
  };

  return (
    <div className="volume-conversion-advanced">
      <h3 className="customizer-subsection-label">{t('customizer.combinePagesAndCharacters')}</h3>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        {t('customizer.mergeCombinedTotal')}
      </label>
      {!enabled && (
        <p className="volume-conversion-hint" id={ratioHintId}>
          {t('customizer.conversionHint')}
        </p>
      )}

      {enabled && (
        <div className="volume-conversion-options">
          <ToggleGroup
            label={t('customizer.showCombinedAs')}
            value={displayAs}
            options={[
              { value: 'chars', label: t('customizer.characters') },
              { value: 'pages', label: t('customizer.pages') },
            ]}
            onChange={onDisplayAsChange}
          />

          <div className="customizer-group">
            <span id={`${ratioInputId}-label`}>{t('customizer.conversionRatio')}</span>
            <label className="volume-ratio-input" htmlFor={ratioInputId}>
              <span>{t('customizer.onePageEquals')}</span>
              <input
                type="text"
                id={ratioInputId}
                inputMode="numeric"
                value={ratioDraft}
                aria-labelledby={`${ratioInputId}-label`}
                aria-describedby={ratioHintId}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === '' || /^\d+$/.test(next)) {
                    setRatioDraft(next);
                  }
                }}
                onBlur={commitRatio}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
              />
              <span>{t('customizer.charactersUnit')}</span>
            </label>
            <p className="sr-only" id={ratioHintId}>
              {t('customizer.conversionRatioHelp')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function NicknameToggle({
  value,
  onChange,
}: {
  value: 'normal' | 'uppercase';
  onChange: (value: 'normal' | 'uppercase') => void;
}) {
  const { t } = useTranslation();

  return (
    <ToggleGroup
      label={t('customizer.nicknameStyle')}
      value={value}
      options={[
        { value: 'normal', label: t('customizer.regular') },
        { value: 'uppercase', label: t('customizer.uppercase') },
      ]}
      onChange={onChange}
    />
  );
}

function SortModeToggle({
  value,
  onChange,
}: {
  value: 'chrono' | 'metric' | 'manual';
  onChange: (value: 'chrono' | 'metric' | 'manual') => void;
}) {
  const { t } = useTranslation();

  return (
    <ToggleGroup
      label={t('customizer.sortOrder')}
      value={value}
      options={[
        { value: 'chrono', label: t('customizer.sortChrono') },
        { value: 'metric', label: t('customizer.sortMetric') },
        { value: 'manual', label: t('customizer.sortManual') },
      ]}
      onChange={onChange}
    />
  );
}

function HistoryOptions({
  showHistory,
  filterTotals,
  onShowHistoryChange,
  onFilterTotalsChange,
  onEnableDefaultMetric,
  hasEnabledMetrics,
}: {
  showHistory: boolean;
  filterTotals: boolean;
  onShowHistoryChange: (value: boolean) => void;
  onFilterTotalsChange: (value: boolean) => void;
  onEnableDefaultMetric: () => void;
  hasEnabledMetrics: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="customizer-group customizer-options-group"
      role="group"
      aria-label={t('customizer.historyOptions')}
    >
      <span>{t('customizer.options')}</span>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={showHistory}
          onChange={(event) => {
            onShowHistoryChange(event.target.checked);
            if (event.target.checked && !hasEnabledMetrics) {
              onEnableDefaultMetric();
            }
          }}
        />
        {t('customizer.showMarathonHistory')}
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={filterTotals}
          onChange={(event) => onFilterTotalsChange(event.target.checked)}
        />
        {t('customizer.filterTotalsAndCharts')}
      </label>
    </div>
  );
}

function MetricChecklist<T extends MetricName | SummaryMetricName>({
  label,
  ariaLabel,
  metrics,
  enabledMetrics,
  volumeConversionEnabled,
  onToggle,
  onReorder,
}: {
  label: string;
  ariaLabel: string;
  metrics: T[];
  enabledMetrics: Set<T>;
  volumeConversionEnabled: boolean;
  onToggle: (metric: T) => void;
  onReorder: (metric: T, direction: 'up' | 'down') => void;
}) {
  const { t } = useTranslation();
  const displayMetrics = metricsOrderForConversion(metrics, volumeConversionEnabled) as T[];

  return (
    <div className="customizer-group" role="group" aria-label={ariaLabel}>
      <span>{label}</span>
      <div className="marathon-checkboxes">
        {displayMetrics.map((metric) => (
          <CheckboxPill
            key={metric}
            label={t(METRIC_LABEL_KEYS[metric])}
            checked={enabledMetrics.has(metric)}
            dimmed={!enabledMetrics.has(metric)}
            onToggle={() => onToggle(metric)}
            onMoveUp={() => onReorder(metric, 'up')}
            onMoveDown={() => onReorder(metric, 'down')}
          />
        ))}
      </div>
    </div>
  );
}

function MarathonChecklist({
  marathons,
  excludedMarathons,
  cardLanguage,
  cardJaNumberStyle,
  onToggle,
  onReorder,
  onQuickSelect,
}: {
  marathons: string[];
  excludedMarathons: Set<string>;
  cardLanguage: CardLanguage;
  cardJaNumberStyle: JaCardNumberStyle;
  onToggle: (marathonName: string) => void;
  onReorder: (marathonName: string, direction: 'up' | 'down') => void;
  onQuickSelect: (type: 'all' | 'none' | 'year') => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="customizer-group" role="group" aria-label={t('customizer.includeMarathons')}>
      <div className="filter-header-row">
        <span>{t('customizer.includedMarathons')}</span>
        <div
          className="quick-select-buttons"
          role="group"
          aria-label={t('customizer.quickSelectMarathons')}
        >
          <button type="button" className="quick-btn" onClick={() => onQuickSelect('all')}>
            {t('customizer.all')}
          </button>
          <button type="button" className="quick-btn" onClick={() => onQuickSelect('year')}>
            {t('customizer.lastYear')}
          </button>
          <button type="button" className="quick-btn" onClick={() => onQuickSelect('none')}>
            {t('customizer.none')}
          </button>
        </div>
      </div>
      <div className="marathon-checkboxes">
        {marathons.map((marathonName) => {
          const season = marathonName.split(' ')[0];
          const emoji = seasonEmojis[season] || '';
          const label = formatMarathonUiLabel(marathonName, cardLanguage, cardJaNumberStyle);
          const isIncluded = !excludedMarathons.has(marathonName);

          return (
            <CheckboxPill
              key={marathonName}
              label={`${emoji} ${label}`}
              checked={isIncluded}
              dimmed={!isIncluded}
              onToggle={() => onToggle(marathonName)}
              onMoveUp={() => onReorder(marathonName, 'up')}
              onMoveDown={() => onReorder(marathonName, 'down')}
            />
          );
        })}
      </div>
    </div>
  );
}

function CheckboxPill({
  label,
  checked,
  dimmed,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  checked: boolean;
  dimmed: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { t } = useTranslation();

  return (
    <label className={`checkbox-pill-label ${dimmed ? 'excluded' : ''}`}>
      <div className="checkbox-pill-content">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span className="pill-text">{label}</span>
      </div>
      <span className="sort-arrows">
        <button
          type="button"
          className="arrow-btn"
          aria-label={t('customizer.moveUp', { label })}
          onClick={(event) => {
            event.preventDefault();
            onMoveUp();
          }}
        >
          ▲
        </button>
        <button
          type="button"
          className="arrow-btn"
          aria-label={t('customizer.moveDown', { label })}
          onClick={(event) => {
            event.preventDefault();
            onMoveDown();
          }}
        >
          ▼
        </button>
      </span>
    </label>
  );
}
