import { useMemo } from 'react';
import { useExactUser } from './useExactUser';
import { getUserMarathonNames } from '../utils/statsQueries';
import type { AllStats } from '../types';

export function useAchievementCardVisible(allStats: AllStats, allUsers: string[]): boolean {
  const { searchQuery, exactUsername, isExactMatch } = useExactUser(allUsers);

  return useMemo(() => {
    if (!searchQuery) return true;
    if (!isExactMatch) return false;
    return getUserMarathonNames(allStats, exactUsername).length > 0;
  }, [searchQuery, isExactMatch, exactUsername, allStats]);
}
