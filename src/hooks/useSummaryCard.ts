import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './StoreContext';
import { useExactUser } from './useExactUser';
import {
  computeCommunityTotals,
  computeUserTotals,
  sortMarathonNames,
} from '../utils/statsQueries';
import {
  getUnifiedVolume,
  isVolumeConversionActive,
  metricsOrderForConversion,
} from '../utils/volumeConversion';
import { findMarathonByGif } from '../utils/marathonTheme';
import { findCanonicalUsername } from '../utils/username';
import type { SummaryDrawContext } from '../utils/drawSummaryCard';
import type { AllStats, MetricName } from '../types';

export type SummaryProfileKey = string;
export const HIDDEN_PROFILE_KEY = 'hidden';

function resolveProfileKey(profileKey: SummaryProfileKey, allUsers: string[]) {
  if (profileKey === HIDDEN_PROFILE_KEY || profileKey === 'community') {
    return { exactUsername: '', isExactMatch: false, displayName: '' };
  }

  const matchedUser = findCanonicalUsername(allUsers, profileKey);
  return {
    exactUsername: matchedUser ?? profileKey,
    isExactMatch: Boolean(matchedUser),
    displayName: matchedUser ?? profileKey,
  };
}

export function useSummaryCardVisibility(allStats: AllStats, allUsers: string[]) {
  const { currentBg, searchDraft, filterTotals, excludedMarathons } = useStore();
  const { exactUsername, isExactMatch, searchQuery, isPartialSearch } = useExactUser(allUsers);

  const draftMatch = findCanonicalUsername(allUsers, searchDraft);
  const effectiveUsername = exactUsername || draftMatch || '';

  const selectedMarathon = useMemo(
    () => findMarathonByGif(allStats, currentBg),
    [allStats, currentBg],
  );

  const totals = useMemo(() => {
    if (!effectiveUsername || !findCanonicalUsername(allUsers, effectiveUsername)) {
      return computeCommunityTotals(allStats, selectedMarathon);
    }

    return computeUserTotals(allStats, effectiveUsername, {
      filterTotals,
      excludedMarathons,
    });
  }, [allStats, effectiveUsername, allUsers, selectedMarathon, filterTotals, excludedMarathons]);

  const isCardHidden =
    isPartialSearch ||
    Boolean(searchQuery && !isExactMatch) ||
    Boolean(isExactMatch && totals.history.length === 0);

  return { exactUsername, effectiveUsername, isCardHidden };
}

export function useSummaryDrawContext(
  profileKey: SummaryProfileKey,
  allStats: AllStats,
  allUsers: string[],
) {
  const {
    currentBg,
    currentAccentColor,
    currentSortMode,
    userMarathonsOrder,
    enabledMetrics,
    excludedMarathons,
    userMetricsOrder,
    summaryMetricsOrder,
    enabledSummaryMetrics,
    showHistory,
    filterTotals,
    cardLanguage,
    cardNicknameCase,
    cardJaNumberStyle,
    cardRoundNumbers,
    volumeConversion,
  } = useStore();

  const { exactUsername, isExactMatch, displayName } = useMemo(
    () => resolveProfileKey(profileKey, allUsers),
    [profileKey, allUsers],
  );

  const selectedMarathon = useMemo(
    () => findMarathonByGif(allStats, currentBg),
    [allStats, currentBg],
  );

  const totals = useMemo(() => {
    if (!isExactMatch) {
      return computeCommunityTotals(allStats, selectedMarathon);
    }

    return computeUserTotals(allStats, exactUsername, {
      filterTotals,
      excludedMarathons,
    });
  }, [allStats, exactUsername, isExactMatch, selectedMarathon, filterTotals, excludedMarathons]);

  const volumeActive = isVolumeConversionActive(volumeConversion, isExactMatch);

  const sortedHistory = useMemo(() => {
    const visibleMarathons = totals.history.filter((name) => !excludedMarathons.has(name));
    const effectiveOrder = metricsOrderForConversion(
      userMetricsOrder,
      volumeActive,
    ) as MetricName[];
    const sortMetric = effectiveOrder.find((metric) => enabledMetrics.has(metric));

    return sortMarathonNames(visibleMarathons, {
      sortMode: currentSortMode,
      sortMetric,
      manualOrder: userMarathonsOrder,
      allStats,
      username: exactUsername,
      volumeConversion,
    });
  }, [
    totals.history,
    excludedMarathons,
    currentSortMode,
    userMetricsOrder,
    enabledMetrics,
    userMarathonsOrder,
    allStats,
    exactUsername,
    volumeConversion,
    volumeActive,
  ]);

  const cardTitle = isExactMatch ? displayName : selectedMarathon;
  const unifiedVolume = volumeActive
    ? getUnifiedVolume(
        totals.pages,
        totals.chars,
        volumeConversion.displayAs,
        volumeConversion.charsPerPage,
      )
    : null;

  return useMemo(
    (): SummaryDrawContext => ({
      state: {
        name: cardTitle,
        time: totals.time,
        count: totals.count,
        pages: totals.pages,
        chars: totals.chars,
        volume: unifiedVolume,
        sources: totals.sources,
        history: sortedHistory,
      },
      currentQuery: exactUsername,
      accentColor: currentAccentColor,
      sortMode: currentSortMode,
      showHistory,
      enabledMetrics,
      metricsOrder: userMetricsOrder,
      enabledSummaryMetrics,
      summaryMetricsOrder,
      excludedMarathons,
      allStats,
      cardLanguage,
      cardNicknameCase,
      cardJaNumberStyle,
      cardRoundNumbers,
      volumeConversion,
    }),
    [
      cardTitle,
      totals,
      sortedHistory,
      exactUsername,
      currentAccentColor,
      currentSortMode,
      showHistory,
      enabledMetrics,
      userMetricsOrder,
      enabledSummaryMetrics,
      summaryMetricsOrder,
      excludedMarathons,
      allStats,
      cardLanguage,
      cardNicknameCase,
      cardJaNumberStyle,
      cardRoundNumbers,
      volumeConversion,
      unifiedVolume,
    ],
  );
}

function createBackgroundCanvas() {
  return document.createElement('canvas');
}

export function useGifBackground(currentBg: string) {
  const activeBgRef = useRef<HTMLCanvasElement>(createBackgroundCanvas());
  const loadIdRef = useRef(0);
  const animatorRef = useRef<GiflerAnimator | null>(null);
  const hasLoadedRef = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [bgEpoch, setBgEpoch] = useState(0);
  const onFrameRef = useRef<() => void>(() => {});

  const setOnFrame = (callback: () => void) => {
    onFrameRef.current = callback;
  };

  const resumeAnimator = () => animatorRef.current?.start();

  useLayoutEffect(() => {
    if (!window.gifler) {
      hasLoadedRef.current = true;
      setIsInitialLoad(false);
      return;
    }

    const loadId = ++loadIdRef.current;
    const nextBgCanvas = createBackgroundCanvas();
    let hasSwappedCanvas = false;
    const gifUrl = `${import.meta.env.BASE_URL}${currentBg}`;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.gifler(gifUrl).get((animator) => {
      if (loadId !== loadIdRef.current) {
        animator.stop();
        return;
      }

      animator.onDrawFrame = (ctx, frame) => {
        if (loadId !== loadIdRef.current) return;
        ctx.drawImage(frame.buffer, frame.x, frame.y);

        if (!hasSwappedCanvas) {
          hasSwappedCanvas = true;
          animatorRef.current?.stop();
          animatorRef.current = animator;
          activeBgRef.current = nextBgCanvas;
          hasLoadedRef.current = true;
          setIsInitialLoad(false);
          setBgEpoch((epoch) => epoch + 1);

          if (prefersReducedMotion) {
            animator.stop();
          }
        }

        onFrameRef.current();
      };

      animator.animateInCanvas(nextBgCanvas);
    });

    return () => {
      loadIdRef.current += 1;
    };
  }, [currentBg]);

  return { activeBgRef, isInitialLoad, bgEpoch, resumeAnimator, setOnFrame };
}
