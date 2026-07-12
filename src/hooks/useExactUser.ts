import { useMemo } from 'react';
import { useStore } from './StoreContext';
import { findCanonicalUsername } from '../utils/username';
import { normalizeUsername } from '../utils/statsQueries';

export interface ExactUserResult {
  searchQuery: string;
  exactUsername: string;
  displayName: string;
  isExactMatch: boolean;
  isPartialSearch: boolean;
}

export function useExactUser(allUsers: string[]): ExactUserResult {
  const { currentQuery, searchDraft } = useStore();

  return useMemo(() => {
    const matchedUser = findCanonicalUsername(allUsers, currentQuery);
    const draftMatch = findCanonicalUsername(allUsers, searchDraft);
    const normalizedDraft = normalizeUsername(searchDraft);

    return {
      searchQuery: currentQuery,
      exactUsername: matchedUser ?? '',
      displayName: matchedUser ?? currentQuery,
      isExactMatch: Boolean(matchedUser),
      isPartialSearch: Boolean(normalizedDraft && !draftMatch),
    };
  }, [currentQuery, searchDraft, allUsers]);
}
