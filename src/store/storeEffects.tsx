import { useEffect, useRef } from 'react';
import { useAppStore } from './appStore';
import {
  loadPerUserMarathonPrefs,
  savePerUserMarathonPrefs,
  savePreferences,
} from '../utils/preferences';
import { findCanonicalUsername } from '../utils/username';
import cardPreviews from '../../data/card-previews.json';

const SEASON_FALLBACKS: Record<string, string> = {
  spring: '#ff00aa',
  summer: '#ffb800',
  winter: '#00aaff',
  fall: '#ff5f00',
  autumn: '#ff5f00',
};

function accentForBackground(gifFilename: string): string | null {
  const previewAccent = (cardPreviews as Record<string, { accent?: string }>)[gifFilename]
    ?.accent;
  if (previewAccent) return previewAccent;

  const lowerBg = gifFilename.toLowerCase();
  if (lowerBg.startsWith('spring')) return SEASON_FALLBACKS.spring;
  if (lowerBg.startsWith('summer')) return SEASON_FALLBACKS.summer;
  if (lowerBg.startsWith('winter')) return SEASON_FALLBACKS.winter;
  if (lowerBg.startsWith('fall') || lowerBg.startsWith('autumn')) return SEASON_FALLBACKS.fall;
  return null;
}

export default function StoreEffects({ allUsers }: { allUsers: string[] }) {
  const hasHydrated = useRef(false);
  const lastLoadedUser = useRef('');

  const currentQuery = useAppStore((state) => state.currentQuery);
  const currentBg = useAppStore((state) => state.currentBg);
  const currentAccentColor = useAppStore((state) => state.currentAccentColor);
  const currentSortMode = useAppStore((state) => state.currentSortMode);
  const enabledMetrics = useAppStore((state) => state.enabledMetrics);
  const userMetricsOrder = useAppStore((state) => state.userMetricsOrder);
  const enabledSummaryMetrics = useAppStore((state) => state.enabledSummaryMetrics);
  const summaryMetricsOrder = useAppStore((state) => state.summaryMetricsOrder);
  const showHistory = useAppStore((state) => state.showHistory);
  const filterTotals = useAppStore((state) => state.filterTotals);
  const cardLanguage = useAppStore((state) => state.cardLanguage);
  const cardNicknameCase = useAppStore((state) => state.cardNicknameCase);
  const cardJaNumberStyle = useAppStore((state) => state.cardJaNumberStyle);
  const cardRoundNumbers = useAppStore((state) => state.cardRoundNumbers);
  const volumeConversion = useAppStore((state) => state.volumeConversion);
  const excludedMarathons = useAppStore((state) => state.excludedMarathons);
  const userMarathonsOrder = useAppStore((state) => state.userMarathonsOrder);

  const setCurrentAccentColor = useAppStore((state) => state.setCurrentAccentColor);
  const setExcludedMarathons = useAppStore((state) => state.setExcludedMarathons);
  const setUserMarathonsOrder = useAppStore((state) => state.setUserMarathonsOrder);
  const setActiveUserForOrder = useAppStore((state) => state.setActiveUserForOrder);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', currentAccentColor);
  }, [currentAccentColor]);

  useEffect(() => {
    const seasonColor = accentForBackground(currentBg);
    if (seasonColor) setCurrentAccentColor(seasonColor);
  }, [currentBg, setCurrentAccentColor]);

  useEffect(() => {
    const canonicalUser = findCanonicalUsername(allUsers, currentQuery);

    if (!canonicalUser) {
      if (!currentQuery) {
        setExcludedMarathons(new Set());
        setUserMarathonsOrder([]);
        setActiveUserForOrder('');
        lastLoadedUser.current = '';
      }
      return;
    }

    if (lastLoadedUser.current === canonicalUser) return;

    const perUser = loadPerUserMarathonPrefs(canonicalUser);
    setExcludedMarathons(new Set(perUser.excludedMarathons));
    setUserMarathonsOrder(perUser.userMarathonsOrder);
    setActiveUserForOrder(canonicalUser);
    lastLoadedUser.current = canonicalUser;
  }, [allUsers, currentQuery, setActiveUserForOrder, setExcludedMarathons, setUserMarathonsOrder]);

  useEffect(() => {
    const canonicalUser = findCanonicalUsername(allUsers, currentQuery);
    if (!canonicalUser || lastLoadedUser.current !== canonicalUser) return;

    savePerUserMarathonPrefs(canonicalUser, {
      excludedMarathons: [...excludedMarathons],
      userMarathonsOrder,
    });
  }, [allUsers, currentQuery, excludedMarathons, userMarathonsOrder]);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    savePreferences({
      currentBg,
      currentAccentColor,
      currentSortMode,
      enabledMetrics: [...enabledMetrics],
      userMetricsOrder,
      enabledSummaryMetrics: [...enabledSummaryMetrics],
      summaryMetricsOrder,
      showHistory,
      filterTotals,
      cardLanguage,
      cardNicknameCase,
      cardJaNumberStyle,
      cardRoundNumbers,
      volumeConversion,
    });
  }, [
    currentBg,
    currentAccentColor,
    currentSortMode,
    enabledMetrics,
    userMetricsOrder,
    enabledSummaryMetrics,
    summaryMetricsOrder,
    showHistory,
    filterTotals,
    cardLanguage,
    cardNicknameCase,
    cardJaNumberStyle,
    cardRoundNumbers,
    volumeConversion,
  ]);

  return null;
}
