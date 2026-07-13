import { useMemo } from 'react';
import { useStore } from '../hooks/StoreContext';
import { useExactUser } from '../hooks/useExactUser';
import { seasonEmojis } from '../constants';
import { getEntryUnifiedVolume, isVolumeConversionActive } from '../utils/volumeConversion';
import {
  getResultsViewForQuery,
  useDisplayedIndividualCards,
} from '../utils/individualCardResults';
import KeyedFadeSection from './KeyedFadeSection';
import type { DataProps, VolumeConversionConfig } from '../types';

export default function IndividualCards({ allStats, allUsers }: DataProps) {
  const { currentAccentColor, volumeConversion } = useStore();
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
  liveIsPartialSearch,
}: DataProps & {
  displayKey: string;
  currentAccentColor: string;
  volumeConversion: VolumeConversionConfig;
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
            accentColor={currentAccentColor}
            time={data.time}
            pages={data.pages}
            characters={data.characters}
            sources={data.sources}
            url={data.url}
            volumeActive={volumeActive}
            unifiedVolume={volumeActive ? getEntryUnifiedVolume(data, volumeConversion) : null}
            volumeUnit={volumeConversion.displayAs}
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

function UserMarathonCard({
  marathonName,
  accentColor,
  time,
  pages,
  characters,
  sources,
  url,
  volumeActive,
  unifiedVolume,
  volumeUnit,
  enterDelayMs,
}: {
  marathonName: string;
  accentColor: string;
  time?: string;
  pages?: number | string;
  characters?: number | string;
  sources?: number | string;
  url?: string;
  volumeActive: boolean;
  unifiedVolume: number | null;
  volumeUnit: 'pages' | 'chars';
  enterDelayMs: number;
}) {
  const season = marathonName.split(' ')[0];
  const emoji = seasonEmojis[season] || '';
  const headingId = `marathon-${marathonName.replace(/\s+/g, '-').toLowerCase()}`;
  const volumeLabel = volumeUnit === 'pages' ? 'PAGES' : 'CHARACTERS';
  const volumeDisplay = unifiedVolume
    ? volumeUnit === 'chars'
      ? unifiedVolume.toLocaleString()
      : String(Math.round(unifiedVolume * 10) / 10)
    : '--';

  return (
    <article
      className="card card-enter"
      style={{ animationDelay: `${enterDelayMs}ms` }}
      aria-labelledby={headingId}
    >
      <div className="card-header" style={{ backgroundColor: accentColor }}>
        <h3 id={headingId} className="marathon-name">
          {emoji} {marathonName}
        </h3>
      </div>
      <div className="card-body">
        <dl className="stats-list">
          <div className="stat-item">
            <dt className="stat-label">TIME</dt>
            <dd className="stat-value">{time || '--'}</dd>
          </div>
          {volumeActive ? (
            <div className="stat-item stat-item-wide">
              <dt className="stat-label">{volumeLabel}</dt>
              <dd className="stat-value">{volumeDisplay}</dd>
            </div>
          ) : (
            <>
              <div className="stat-item">
                <dt className="stat-label">PAGES</dt>
                <dd className="stat-value">{pages || '--'}</dd>
              </div>
              <div className="stat-item">
                <dt className="stat-label">CHARACTERS</dt>
                <dd className="stat-value">
                  {characters ? Number(characters).toLocaleString() : '--'}
                </dd>
              </div>
            </>
          )}
          <div className="stat-item">
            <dt className="stat-label">SOURCES</dt>
            <dd className="stat-value">{sources || '--'}</dd>
          </div>
        </dl>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
            style={{ color: 'var(--wk-blue)' }}
          >
            View Original Post →
          </a>
        )}
      </div>
    </article>
  );
}
