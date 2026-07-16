import { useState, useEffect } from 'react';
import allStatsData from '../../data/all_stats.json';
import allUsersData from '../../data/users.json';
import dataMeta from '../../data/meta.json';
import { parseAllStats, parseDataMeta, parseUsers } from '../schemas/data';
import type { AllStats } from '../types';

interface UseDataResult {
  allStats: AllStats;
  allUsers: string[];
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

export function useData(): UseDataResult {
  const [allStats, setAllStats] = useState<AllStats>({});
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAllStats(parseAllStats(allStatsData));
      setAllUsers(parseUsers(allUsersData));
      setLastUpdated(parseDataMeta(dataMeta).lastUpdated);
      setLoading(false);
    } catch (err) {
      console.error('Error validating data:', err);
      setError('Failed to load statistics data. The bundled data may be invalid.');
      setLoading(false);
    }
  }, []);

  return {
    allStats,
    allUsers,
    lastUpdated,
    loading,
    error,
  };
}
