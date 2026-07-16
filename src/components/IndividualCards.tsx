import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../hooks/StoreContext';
import { useExactUser } from '../hooks/useExactUser';
import { seasonEmojis } from '../constants';
import { formatMarathonUiLabel } from '../constants/cardCopy';
import { getMarathonAccentColor, getMarathonPreviewUrl } from '../utils/cardPreviews';
import { getMarathonThreadUrl } from '../utils/marathonThreads';
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
  const { t } = useTranslation();
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
    if (resultsView === 'cards')
      return t('individualCards.historyForUser', { username: searchQuery });
    if (resultsView === 'no-results') return t('search.resultsRegion');
    return t('individualCards.history');
  }, [resultsView, searchQuery, t]);

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
  const { t } = useTranslation();
  const { searchQuery, resultsView, userCards, isPartialSearch, isExactMatch } =
    useDisplayedIndividualCards(displayKey, allStats, allUsers);
  const volumeActive = isVolumeConversionActive(volumeConversion, isExactMatch);
  const showPartialHint = isPartialSearch || (liveIsPartialSearch && resultsView === 'placeholder');

  if (resultsView === 'placeholder') {
    return (
      <div className="placeholder" role="status">
        <p>{showPartialHint ? t('search.selectMatchHint') : t('search.promptHistory')}</p>
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
            threadUrl={getMarathonThreadUrl(marathonName)}
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
      {t('search.noResults', { query: searchQuery })}
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
  threadUrl,
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
  threadUrl: string | null;
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
  const { t } = useTranslation();
  const season = marathonName.split(' ')[0] ?? '';
  const year = marathonName.split(' ')[1] ?? '';
  const emoji = seasonEmojis[season] || '';
  const displayTitle = formatMarathonUiLabel(marathonName, cardLanguage, cardJaNumberStyle);
  const headingId = `marathon-${marathonName.replace(/\s+/g, '-').toLowerCase()}`;
  const statsId = `${headingId}-stats`;
  const volumeLabel =
    volumeUnit === 'pages'
      ? t('individualCards.combinedPages')
      : t('individualCards.combinedCharacters');
  const timeDisplay = time?.trim() ? time : t('common.notAvailable');
  const hasLink = Boolean(url);

  const titleContent = (
    <>
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
    </>
  );

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
          {threadUrl ? (
            <a
              href={threadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="marathon-name-link"
            >
              {titleContent}
              <span className="sr-only">{t('individualCards.marathonThreadNewTab')}</span>
            </a>
          ) : (
            titleContent
          )}
        </h3>
      </header>

      <div className="card-body">
        <dl id={statsId} className="stats-list">
          <div className="stat-item stat-item--primary">
            <dt className="stat-label">{t('individualCards.time')}</dt>
            <dd
              className="stat-value"
              aria-label={
                timeDisplay === t('common.notAvailable')
                  ? t('individualCards.timeUnavailable')
                  : undefined
              }
            >
              {timeDisplay}
            </dd>
          </div>
          {showPages && (
            <div className="stat-item">
              <dt className="stat-label">{t('individualCards.pages')}</dt>
              <dd
                className="stat-value"
                aria-label={
                  isMissingStat(pages) ? t('individualCards.pagesUnavailable') : undefined
                }
              >
                {formatStatValue(pages)}
              </dd>
            </div>
          )}
          {showCharacters && (
            <div className="stat-item">
              <dt className="stat-label">{t('individualCards.characters')}</dt>
              <dd
                className="stat-value"
                aria-label={
                  isMissingStat(characters) ? t('individualCards.charactersUnavailable') : undefined
                }
              >
                {formatStatValue(characters)}
              </dd>
            </div>
          )}
          {showCombined && unifiedVolume != null && (
            <div className="stat-item">
              <dt className="stat-label">{volumeLabel}</dt>
              <dd className="stat-value">{formatCombinedDisplay(unifiedVolume, volumeUnit)}</dd>
            </div>
          )}
          {showSources && (
            <div className="stat-item">
              <dt className="stat-label">{t('individualCards.sources')}</dt>
              <dd
                className="stat-value"
                aria-label={
                  isMissingStat(sources) ? t('individualCards.sourcesUnavailable') : undefined
                }
              >
                {formatStatValue(sources)}
              </dd>
            </div>
          )}
        </dl>

        {hasLink && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="card-link">
            <span>{t('individualCards.viewOriginalPost')}</span>
            <span className="card-link-arrow" aria-hidden="true">
              →
            </span>
            <span className="sr-only">{t('individualCards.opensNewTab')}</span>
          </a>
        )}
      </div>
    </article>
  );
}
