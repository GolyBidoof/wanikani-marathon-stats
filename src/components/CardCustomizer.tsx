import { useEffect, useMemo, useState, useId } from 'react';
import { useStore } from '../hooks/StoreContext';
import { useCardCustomizerData } from '../hooks/useCardCustomizer';
import { useAchievementCardVisible } from '../hooks/useAchievementCardVisible';
import { seasonEmojis } from '../constants';
import { replacePagesCharsWithVolume } from '../utils/volumeConversion';
import ToggleGroup from './a11y/ToggleGroup';
import FadeSection from './FadeSection';
import type { DataProps, MetricName, VolumeDisplayUnit } from '../types';

const METRIC_LABELS: Record<MetricName, string> = {
  time: 'Time',
  pages: 'Pages',
  chars: 'Chars',
  sources: 'Sources',
  volume: 'Volume',
};

const CUSTOMIZER_CONTENT_ID = 'customizer-content';

export default function CardCustomizer({ allStats, allUsers }: DataProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCardVisible = useAchievementCardVisible(allStats, allUsers);
  const { hasUserControls, sortedUserMarathons, reorderMetric, reorderMarathon, applyQuickSelect } =
    useCardCustomizerData(allStats, allUsers);

  const {
    currentSortMode,
    setCurrentSortMode,
    enabledMetrics,
    setEnabledMetrics,
    excludedMarathons,
    userMetricsOrder,
    showHistory,
    setShowHistory,
    filterTotals,
    setFilterTotals,
    cardNicknameCase,
    setCardNicknameCase,
    toggleMetric,
    toggleMarathon,
    volumeConversion,
    setVolumeConversionEnabled,
    setVolumeDisplayAs,
    setVolumeCharsPerPage,
    cardLanguage,
    cardJaNumberStyle,
    cardRoundNumbers,
  } = useStore();

  const headerSummary = useMemo(() => {
    const languageLabel = cardLanguage === 'ja' ? 'Japanese' : 'English';
    const numberStyleLabel =
      cardLanguage === 'ja'
        ? cardJaNumberStyle === 'words'
          ? 'word-style numbers'
          : 'standard numerals'
        : null;
    const displayLabel = cardRoundNumbers ? 'rounded numbers' : 'exact numbers';
    const volumeLabel =
      hasUserControls && volumeConversion.enabled ? 'combined reading volume' : null;

    return [languageLabel, numberStyleLabel, displayLabel, volumeLabel].filter(Boolean).join(' · ');
  }, [
    cardLanguage,
    cardJaNumberStyle,
    cardRoundNumbers,
    hasUserControls,
    volumeConversion.enabled,
  ]);

  return (
    <FadeSection
      show={isCardVisible}
      as="section"
      className={`customizer-card ${isExpanded ? 'expanded' : ''}`}
      aria-label="Achievement card customization"
    >
      <button
        type="button"
        className="customizer-header"
        aria-expanded={isExpanded}
        aria-controls={CUSTOMIZER_CONTENT_ID}
        aria-label={
          isExpanded ? undefined : `Customize achievement card. Current settings: ${headerSummary}`
        }
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="customizer-header-text">
          <span className="customizer-header-title">Customize Achievement Card</span>
          {!isExpanded && (
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

      {isExpanded && (
        <div id={CUSTOMIZER_CONTENT_ID} className="customizer-content">
          <div className="customizer-section customizer-section-first">
            <h2 className="customizer-section-label">Language &amp; Numbers</h2>
            <CardFormatSettings />
          </div>

          {hasUserControls && (
            <div className="customizer-section">
              <h2 className="customizer-section-label">Card Content</h2>
              <div className="customizer-controls">
                <div className="customizer-column">
                  <NicknameToggle value={cardNicknameCase} onChange={setCardNicknameCase} />
                  <SortModeToggle value={currentSortMode} onChange={setCurrentSortMode} />
                  <HistoryOptions
                    showHistory={showHistory}
                    filterTotals={filterTotals}
                    onShowHistoryChange={setShowHistory}
                    onFilterTotalsChange={setFilterTotals}
                    onEnableDefaultMetric={() => setEnabledMetrics(new Set(['time']))}
                    hasEnabledMetrics={enabledMetrics.size > 0}
                  />
                  <MetricChecklist
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
                    onToggle={toggleMarathon}
                    onReorder={reorderMarathon}
                    onQuickSelect={applyQuickSelect}
                  />
                </div>
              </div>

              <VolumeConversionSettings
                enabled={volumeConversion.enabled}
                displayAs={volumeConversion.displayAs}
                charsPerPage={volumeConversion.charsPerPage}
                onEnabledChange={setVolumeConversionEnabled}
                onDisplayAsChange={setVolumeDisplayAs}
                onCharsPerPageChange={setVolumeCharsPerPage}
              />
            </div>
          )}
        </div>
      )}
    </FadeSection>
  );
}

function CardFormatSettings() {
  const {
    cardLanguage,
    setCardLanguage,
    cardJaNumberStyle,
    setCardJaNumberStyle,
    cardRoundNumbers,
    setCardRoundNumbers,
  } = useStore();

  return (
    <div className="customizer-format-grid">
      <div className="customizer-format-language">
        <ToggleGroup
          label="Card Language"
          value={cardLanguage}
          options={[
            { value: 'en', label: 'English' },
            { value: 'ja', label: '日本語' },
          ]}
          onChange={setCardLanguage}
        />

        {cardLanguage === 'ja' && (
          <ToggleGroup
            label="Number Style"
            value={cardJaNumberStyle}
            options={[
              { value: 'words', label: 'Words' },
              { value: 'numbers', label: 'Numbers' },
            ]}
            onChange={setCardJaNumberStyle}
          />
        )}
      </div>

      <ToggleGroup
        label="Number Display"
        value={cardRoundNumbers ? 'rounded' : 'exact'}
        options={[
          { value: 'exact', label: 'Exact' },
          { value: 'rounded', label: 'Rounded' },
        ]}
        onChange={(value) => setCardRoundNumbers(value === 'rounded')}
      />
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
      <h3 className="customizer-section-label">Pages &amp; Characters</h3>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        Combine into one total
      </label>
      {!enabled && (
        <p className="volume-conversion-hint" id={ratioHintId}>
          Tracked pages in one marathon, characters in another? Set a ratio and we&apos;ll merge
          them.
        </p>
      )}

      {enabled && (
        <div className="volume-conversion-options">
          <ToggleGroup
            label="Show as"
            value={displayAs}
            options={[
              { value: 'chars', label: 'Characters' },
              { value: 'pages', label: 'Pages' },
            ]}
            onChange={onDisplayAsChange}
          />

          <div className="customizer-group">
            <span id={`${ratioInputId}-label`}>Ratio</span>
            <label className="volume-ratio-input" htmlFor={ratioInputId}>
              <span>1 page =</span>
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
              <span>characters</span>
            </label>
            <p className="sr-only" id={ratioHintId}>
              Enter how many characters equal one page when combining reading volume.
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
  return (
    <ToggleGroup
      label="Nickname"
      value={value}
      options={[
        { value: 'normal', label: 'Regular' },
        { value: 'uppercase', label: 'Uppercase' },
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
  return (
    <ToggleGroup
      label="Sort History"
      value={value}
      options={[
        { value: 'chrono', label: 'Chrono' },
        { value: 'metric', label: 'Metric' },
        { value: 'manual', label: 'Manual' },
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
  return (
    <div
      className="customizer-group customizer-options-group"
      role="group"
      aria-label="Card options"
    >
      <span>Options</span>
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
        Show marathon history
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={filterTotals}
          onChange={(event) => onFilterTotalsChange(event.target.checked)}
        />
        Filter totals &amp; charts by checklist
      </label>
    </div>
  );
}

function MetricChecklist({
  metrics,
  enabledMetrics,
  volumeConversionEnabled,
  onToggle,
  onReorder,
}: {
  metrics: MetricName[];
  enabledMetrics: Set<MetricName>;
  volumeConversionEnabled: boolean;
  onToggle: (metric: MetricName) => void;
  onReorder: (metric: MetricName, direction: 'up' | 'down') => void;
}) {
  const displayMetrics = volumeConversionEnabled
    ? (replacePagesCharsWithVolume(metrics) as MetricName[])
    : metrics.filter((metric) => metric !== 'volume');

  const volumeLabel = volumeConversionEnabled ? METRIC_LABELS.volume : '';

  return (
    <div className="customizer-group" role="group" aria-label="Metrics in history">
      <span>Metrics in History</span>
      <div className="marathon-checkboxes">
        {displayMetrics.map((metric) => (
          <CheckboxPill
            key={metric}
            label={metric === 'volume' ? volumeLabel : METRIC_LABELS[metric]}
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
  onToggle,
  onReorder,
  onQuickSelect,
}: {
  marathons: string[];
  excludedMarathons: Set<string>;
  onToggle: (marathonName: string) => void;
  onReorder: (marathonName: string, direction: 'up' | 'down') => void;
  onQuickSelect: (type: 'all' | 'none' | 'year') => void;
}) {
  return (
    <>
      <div className="filter-header-row" role="group" aria-label="Include marathons">
        <span>Include Marathons</span>
        <div className="quick-select-buttons" role="group" aria-label="Quick select marathons">
          <button type="button" className="quick-btn" onClick={() => onQuickSelect('all')}>
            All
          </button>
          <button type="button" className="quick-btn" onClick={() => onQuickSelect('year')}>
            Last Year
          </button>
          <button type="button" className="quick-btn" onClick={() => onQuickSelect('none')}>
            None
          </button>
        </div>
      </div>
      <div className="marathon-checkboxes">
        {marathons.map((marathonName) => {
          const season = marathonName.split(' ')[0];
          const emoji = seasonEmojis[season] || '';
          const isIncluded = !excludedMarathons.has(marathonName);

          return (
            <CheckboxPill
              key={marathonName}
              label={`${emoji} ${marathonName}`}
              checked={isIncluded}
              dimmed={!isIncluded}
              onToggle={() => onToggle(marathonName)}
              onMoveUp={() => onReorder(marathonName, 'up')}
              onMoveDown={() => onReorder(marathonName, 'down')}
            />
          );
        })}
      </div>
    </>
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
          aria-label={`Move ${label} up`}
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
          aria-label={`Move ${label} down`}
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
