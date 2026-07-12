import { useState, useEffect } from 'react';
import allStatsData from '../../all_stats.json';
import allUsersData from '../../users.json';
import dataMeta from '../../data_meta.json';
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
