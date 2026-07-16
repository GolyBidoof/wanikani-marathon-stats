import { useMemo, type CSSProperties } from 'react';
import { useStore } from '../hooks/StoreContext';
import { useExactUser } from '../hooks/useExactUser';
import { seasonEmojis } from '../constants';
import { formatMarathonUiLabel } from '../constants/cardCopy';
import { getMarathonAccentColor, getMarathonPreviewUrl } from '../utils/cardPreviews';
import { getEntryUnifiedVolume, isVolumeConversionActive } from '../utils/volumeConversion';
import {
  getResultsViewForQuery,
  useDisplayedIndividualCards,
} from '../utils/individualCardResults';
import KeyedFadeSection from './KeyedFadeSection';
import type {
  CardLanguage,
  DataProps,
  JaCardNumberStyle,
  SummaryMetricName,
  VolumeConversionConfig,
  VolumeDisplayUnit,
} from '../types';

function isMissingStat(value: number | string | undefined): boolean {
  return value == null || value === '';
}

export default function IndividualCards({ allStats, allUsers }: DataProps) {
  const {
    currentAccentColor,
    volumeConversion,
    enabledSummaryMetrics,
    cardLanguage,
    cardJaNumberStyle,
  } = useStore();
  const { searchQuery, isPartialSearch } = useExactUser(allUsers);

  const resultsView = useMemo(
    () => getResultsViewForQuery(searchQuery, allStats, allUsers),
    [searchQuery, allStats, allUsers],
  );

  const contentKey = `${searchQuery}:${resultsView}`;

  const sectionLabel = useMemo(() => {
    if (resultsView === 'cards') return `Marathon history for ${searchQuery}`;
    if (resultsView === 'no-results') return 'Search results';
    return 'Marathon history';
  }, [resultsView, searchQuery]);

  return (
    <KeyedFadeSection
      as="section"
      contentKey={contentKey}
      className="results-grid"
      aria-label={sectionLabel}
    >
      {(displayKey) => (
        <DisplayedResults
          displayKey={displayKey}
          allStats={allStats}
          allUsers={allUsers}
          currentAccentColor={currentAccentColor}
          volumeConversion={volumeConversion}
          enabledSummaryMetrics={enabledSummaryMetrics}
          cardLanguage={cardLanguage}
          cardJaNumberStyle={cardJaNumberStyle}
          liveIsPartialSearch={isPartialSearch}
        />
      )}
    </KeyedFadeSection>
  );
}

function DisplayedResults({
  displayKey,
  allStats,
  allUsers,
  currentAccentColor,
  volumeConversion,
  enabledSummaryMetrics,
  cardLanguage,
  cardJaNumberStyle,
  liveIsPartialSearch,
}: DataProps & {
  displayKey: string;
  currentAccentColor: string;
  volumeConversion: VolumeConversionConfig;
  enabledSummaryMetrics: Set<SummaryMetricName>;
  cardLanguage: CardLanguage;
  cardJaNumberStyle: JaCardNumberStyle;
  liveIsPartialSearch: boolean;
}) {
  const { searchQuery, resultsView, userCards, isPartialSearch, isExactMatch } =
    useDisplayedIndividualCards(displayKey, allStats, allUsers);
  const volumeActive = isVolumeConversionActive(volumeConversion, isExactMatch);
  const showPartialHint = isPartialSearch || (liveIsPartialSearch && resultsView === 'placeholder');

  if (resultsView === 'placeholder') {
    return (
      <div className="placeholder" role="status">
        <p>
          {showPartialHint
            ? 'Select a matching username above to see marathon history.'
            : 'Search for a user to see their marathon history.'}
        </p>
      </div>
    );
  }

  if (resultsView === 'cards') {
    return (
      <>
        {userCards.map(({ marathonName, data }, index) => (
          <UserMarathonCard
            key={marathonName}
            marathonName={marathonName}
            accentColor={getMarathonAccentColor(marathonName, currentAccentColor)}
            previewUrl={getMarathonPreviewUrl(marathonName)}
            time={data.time}
            pages={data.pages}
            characters={data.characters}
            sources={data.sources}
            url={data.url}
            showPages={enabledSummaryMetrics.has('pages')}
            showCharacters={enabledSummaryMetrics.has('chars')}
            showCombined={volumeActive && enabledSummaryMetrics.has('volume')}
            showSources={enabledSummaryMetrics.has('sources')}
            unifiedVolume={volumeActive ? getEntryUnifiedVolume(data, volumeConversion) : null}
            volumeUnit={volumeConversion.displayAs}
            cardLanguage={cardLanguage}
            cardJaNumberStyle={cardJaNumberStyle}
            enterDelayMs={index * 60}
          />
        ))}
      </>
    );
  }

  return (
    <div className="no-results" role="status">
      No results found for &quot;{searchQuery}&quot;. Check spelling or try a different name.
    </div>
  );
}

function formatCombinedDisplay(value: number, unit: VolumeDisplayUnit): string {
  if (unit === 'chars') return value.toLocaleString();
  return String(Math.round(value * 10) / 10);
}

function formatStatValue(value: number | string | undefined): string {
  if (value == null || value === '') return '—';
  const asNumber = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(asNumber)) return asNumber.toLocaleString();
  return String(value);
}

function UserMarathonCard({
  marathonName,
  accentColor,
  previewUrl,
  time,
  pages,
  characters,
  sources,
  url,
  showPages,
  showCharacters,
  showCombined,
  showSources,
  unifiedVolume,
  volumeUnit,
  cardLanguage,
  cardJaNumberStyle,
  enterDelayMs,
}: {
  marathonName: string;
  accentColor: string;
  previewUrl: string | null;
  time?: string;
  pages?: number | string;
  characters?: number | string;
  sources?: number | string;
  url?: string;
  showPages: boolean;
  showCharacters: boolean;
  showCombined: boolean;
  showSources: boolean;
  unifiedVolume: number | null;
  volumeUnit: VolumeDisplayUnit;
  cardLanguage: CardLanguage;
  cardJaNumberStyle: JaCardNumberStyle;
  enterDelayMs: number;
}) {
  const season = marathonName.split(' ')[0] ?? '';
  const year = marathonName.split(' ')[1] ?? '';
  const emoji = seasonEmojis[season] || '';
  const displayTitle = formatMarathonUiLabel(marathonName, cardLanguage, cardJaNumberStyle);
  const headingId = `marathon-${marathonName.replace(/\s+/g, '-').toLowerCase()}`;
  const statsId = `${headingId}-stats`;
  const volumeLabel = volumeUnit === 'pages' ? 'Combined pages' : 'Combined characters';
  const timeDisplay = time?.trim() ? time : '—';
  const hasLink = Boolean(url);

  return (
    <article
      className={`card card-enter${previewUrl ? ' card--has-preview' : ''}`}
      style={
        {
          animationDelay: `${enterDelayMs}ms`,
          '--card-accent': accentColor,
          ...(previewUrl ? { '--card-preview': `url(${JSON.stringify(previewUrl)})` } : null),
        } as CSSProperties
      }
      aria-labelledby={headingId}
      aria-describedby={statsId}
    >
      <header className="card-header">
        <h3 id={headingId} className="marathon-name">
          {emoji ? (
            <span className="card-season-emoji" aria-hidden="true">
              {emoji}
            </span>
          ) : null}
          {cardLanguage === 'ja' ? (
            <span className="card-season-text">{displayTitle}</span>
          ) : (
            <span className="card-season-text">
              <span className="card-season">{season}</span>
              {year ? <span className="card-year">{year}</span> : null}
            </span>
          )}
        </h3>
      </header>

      <div className="card-body">
        <dl id={statsId} className="stats-list">
          <div className="stat-item stat-item--primary">
            <dt className="stat-label">Time</dt>
            <dd
              className="stat-value"
              aria-label={timeDisplay === '—' ? 'Time not available' : undefined}
            >
              {timeDisplay}
            </dd>
          </div>
          {showPages && (
            <div className="stat-item">
              <dt className="stat-label">Pages</dt>
              <dd
                className="stat-value"
                aria-label={isMissingStat(pages) ? 'Pages not available' : undefined}
              >
                {formatStatValue(pages)}
              </dd>
            </div>
          )}
          {showCharacters && (
            <div className="stat-item">
              <dt className="stat-label">Characters</dt>
              <dd
                className="stat-value"
                aria-label={
                  isMissingStat(characters) ? 'Characters not available' : undefined
                }
              >
                {formatStatValue(characters)}
              </dd>
            </div>
          )}
          {showCombined && unifiedVolume != null && (
            <div className="stat-item">
              <dt className="stat-label">{volumeLabel}</dt>
              <dd className="stat-value">
                {formatCombinedDisplay(unifiedVolume, volumeUnit)}
              </dd>
            </div>
          )}
          {showSources && (
            <div className="stat-item">
              <dt className="stat-label">Sources</dt>
              <dd
                className="stat-value"
                aria-label={isMissingStat(sources) ? 'Sources not available' : undefined}
              >
                {formatStatValue(sources)}
              </dd>
            </div>
          )}
        </dl>

        {hasLink && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
          >
            <span>View original post</span>
            <span className="card-link-arrow" aria-hidden="true">
              →
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </article>
  );
}
