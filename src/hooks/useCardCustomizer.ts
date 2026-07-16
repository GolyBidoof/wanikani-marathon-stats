import { useMemo, useEffect } from 'react';
import { useStore } from '../hooks/StoreContext';
import { useExactUser } from '../hooks/useExactUser';
import {
  getUserMarathonNames,
  getLastYearMarathonNames,
  sortMarathonNames,
} from '../utils/statsQueries';
import { metricsOrderForConversion } from '../utils/volumeConversion';
import type { AllStats, MetricName, SummaryMetricName } from '../types';

export function useCardCustomizerData(allStats: AllStats, allUsers: string[]) {
  const {
    currentSortMode,
    setCurrentSortMode,
    userMarathonsOrder,
    setUserMarathonsOrder,
    activeUserForOrder,
    setActiveUserForOrder,
    enabledMetrics,
    userMetricsOrder,
    setUserMetricsOrder,
    summaryMetricsOrder,
    setSummaryMetricsOrder,
    setExcludedMarathons,
    volumeConversion,
  } = useStore();

  const { exactUsername, isExactMatch } = useExactUser(allUsers);

  const userMarathons = useMemo(
    () => getUserMarathonNames(allStats, exactUsername),
    [allStats, exactUsername],
  );

  const hasUserControls = userMarathons.length > 0;

  useEffect(() => {
    if (!isExactMatch || userMarathons.length === 0) return;
    if (activeUserForOrder === exactUsername) return;

    setUserMarathonsOrder(userMarathons);
    setActiveUserForOrder(exactUsername);
  }, [
    isExactMatch,
    exactUsername,
    userMarathons,
    activeUserForOrder,
    setUserMarathonsOrder,
    setActiveUserForOrder,
  ]);

  const sortedUserMarathons = useMemo(() => {
    const effectiveOrder = metricsOrderForConversion(
      userMetricsOrder,
      volumeConversion.enabled,
    ) as MetricName[];
    const sortMetric = effectiveOrder.find((metric) => enabledMetrics.has(metric));

    return sortMarathonNames(userMarathons, {
      sortMode: currentSortMode,
      sortMetric,
      manualOrder: userMarathonsOrder,
      allStats,
      username: exactUsername,
      volumeConversion,
    });
  }, [
    userMarathons,
    currentSortMode,
    userMetricsOrder,
    enabledMetrics,
    userMarathonsOrder,
    allStats,
    exactUsername,
    volumeConversion,
  ]);

  const moveItem = <T>(items: T[], index: number, direction: 'up' | 'down'): T[] => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return items;

    const next = [...items];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    return next;
  };

  const reorderMetric = (metric: MetricName, direction: 'up' | 'down') => {
    const workingOrder = metricsOrderForConversion(
      userMetricsOrder,
      volumeConversion.enabled,
    ) as MetricName[];
    const index = workingOrder.indexOf(metric);
    if (index === -1) return;
    setUserMetricsOrder(moveItem(workingOrder, index, direction));
  };

  const reorderSummaryMetric = (metric: SummaryMetricName, direction: 'up' | 'down') => {
    const workingOrder = metricsOrderForConversion(
      summaryMetricsOrder,
      volumeConversion.enabled,
    ) as SummaryMetricName[];
    const index = workingOrder.indexOf(metric);
    if (index === -1) return;
    setSummaryMetricsOrder(moveItem(workingOrder, index, direction));
  };

  const reorderMarathon = (marathonName: string, direction: 'up' | 'down') => {
    const currentOrder =
      currentSortMode === 'manual' ? [...userMarathonsOrder] : [...sortedUserMarathons];

    if (currentSortMode !== 'manual') {
      setCurrentSortMode('manual');
    }

    const index = currentOrder.indexOf(marathonName);
    if (index === -1) return;
    setUserMarathonsOrder(moveItem(currentOrder, index, direction));
  };

  const applyQuickSelect = (type: 'all' | 'none' | 'year') => {
    if (type === 'all') {
      setExcludedMarathons(new Set());
      return;
    }

    if (type === 'none') {
      setExcludedMarathons(new Set(userMarathons));
      return;
    }

    const recentMarathons = getLastYearMarathonNames(allStats);
    const excluded = new Set(
      userMarathons.filter((marathonName) => !recentMarathons.has(marathonName)),
    );
    setExcludedMarathons(excluded);
  };

  return {
    hasUserControls: isExactMatch && hasUserControls,
    sortedUserMarathons,
    reorderMetric,
    reorderSummaryMetric,
    reorderMarathon,
    applyQuickSelect,
  };
}
