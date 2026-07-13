import { useMemo } from 'react';
import { findCanonicalUsername } from './username';
import { findUserEntry } from './statsQueries';
import { getMarathonOrder } from './helpers';
import type { AllStats } from '../types';

export type ResultsView = 'placeholder' | 'cards' | 'no-results';

export function parseResultsContentKey(contentKey: string): {
  searchQuery: string;
  resultsView: ResultsView;
} {
  const separatorIndex = contentKey.lastIndexOf(':');
  if (separatorIndex === -1) {
    return { searchQuery: '', resultsView: 'placeholder' };
  }

  return {
    searchQuery: contentKey.slice(0, separatorIndex),
    resultsView: contentKey.slice(separatorIndex + 1) as ResultsView,
  };
}

export function getResultsViewForQuery(
  searchQuery: string,
  allStats: AllStats,
  allUsers: string[],
): ResultsView {
  if (!searchQuery) return 'placeholder';

  const marathonNamesNewestFirst = [...getMarathonOrder(allStats)].reverse();
  const hasCards = marathonNamesNewestFirst.some((marathonName) =>
    Boolean(findUserEntry(allStats, marathonName, searchQuery)),
  );

  if (hasCards) return 'cards';

  const isPartialSearch = Boolean(
    searchQuery.trim() && !findCanonicalUsername(allUsers, searchQuery),
  );
  if (isPartialSearch) return 'placeholder';

  return 'no-results';
}

export function useDisplayedIndividualCards(
  displayKey: string,
  allStats: AllStats,
  allUsers: string[],
) {
  const { searchQuery, resultsView } = useMemo(
    () => parseResultsContentKey(displayKey),
    [displayKey],
  );

  const marathonNamesNewestFirst = useMemo(
    () => [...getMarathonOrder(allStats)].reverse(),
    [allStats],
  );

  const userCards = useMemo(() => {
    if (!searchQuery) return [];

    return marathonNamesNewestFirst.flatMap((marathonName) => {
      const entry = findUserEntry(allStats, marathonName, searchQuery);
      return entry ? [{ marathonName, data: entry }] : [];
    });
  }, [allStats, marathonNamesNewestFirst, searchQuery]);

  const isPartialSearch = useMemo(
    () => Boolean(searchQuery.trim() && !findCanonicalUsername(allUsers, searchQuery)),
    [searchQuery, allUsers],
  );

  const isExactMatch = useMemo(
    () => Boolean(findCanonicalUsername(allUsers, searchQuery)),
    [searchQuery, allUsers],
  );

  return {
    searchQuery,
    resultsView,
    userCards,
    isPartialSearch,
    isExactMatch,
  };
}
