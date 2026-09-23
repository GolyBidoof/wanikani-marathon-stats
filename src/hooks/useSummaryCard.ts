import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './StoreContext';
import { useExactUser } from './useExactUser';
import {
  computeCommunityTotals,
  computeUserTotals,
  findLatestUserBadge,
  sortMarathonNames,
} from '../utils/statsQueries';
import { describeBadge, emojiAssetPaths, resolveEmojiList } from '../constants/emoji';
import {
  expandCombinedMetric,
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
    cardShowEmoji,
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
  // Marathon totals never merge pages into characters; only a reader's own card does.
  const viewSummaryMetrics = useMemo(
    () => new Set(expandCombinedMetric(enabledSummaryMetrics, volumeActive)),
    [enabledSummaryMetrics, volumeActive],
  );
  const viewSummaryOrder = useMemo(
    () => expandCombinedMetric(summaryMetricsOrder, volumeActive),
    [summaryMetricsOrder, volumeActive],
  );

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
  const badge = useMemo(
    () => (isExactMatch ? findLatestUserBadge(allStats, exactUsername) : undefined),
    [isExactMatch, allStats, exactUsername],
  );
  const badgeEmoji = useMemo(() => resolveEmojiList(badge?.emoji), [badge]);
  const badgeImage = badge?.emojiImage ?? null;
  const badgeLabel = useMemo(
    () => (badge ? describeBadge(badge.emoji, badge.emojiImage) : null),
    [badge],
  );
  const badgeImagePaths = useMemo(
    () => (badgeImage ? [badgeImage] : emojiAssetPaths(badge?.emoji ?? '')),
    [badge, badgeImage],
  );
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
        emoji: badgeEmoji,
        emojiImage: badgeImage,
      },
      badgeImagePaths,
      badgeLabel,
      currentQuery: exactUsername,
      accentColor: currentAccentColor,
      sortMode: currentSortMode,
      showHistory,
      enabledMetrics,
      metricsOrder: userMetricsOrder,
      summaryMetricsOrder: viewSummaryOrder,
      enabledSummaryMetrics: viewSummaryMetrics,
      excludedMarathons,
      allStats,
      cardLanguage,
      cardNicknameCase,
      cardJaNumberStyle,
      cardRoundNumbers,
      cardShowEmoji,
      volumeConversion,
    }),
    [
      cardTitle,
      totals,
      sortedHistory,
      badgeEmoji,
      badgeImage,
      badgeImagePaths,
      badgeLabel,
      exactUsername,
      currentAccentColor,
      currentSortMode,
      showHistory,
      enabledMetrics,
      userMetricsOrder,
      viewSummaryOrder,
      viewSummaryMetrics,
      excludedMarathons,
      allStats,
      cardLanguage,
      cardNicknameCase,
      cardJaNumberStyle,
      cardRoundNumbers,
      cardShowEmoji,
      volumeConversion,
      unifiedVolume,
    ],
  );
}

function createBackgroundCanvas() {
  return document.createElement('canvas');
}

const badgeImageCache = new Map<string, HTMLImageElement>();

function readyBadgeImage(path: string): HTMLImageElement | null {
  const image = badgeImageCache.get(path);
  return image && image.complete && image.naturalWidth > 0 ? image : null;
}

/** Loads a reader's badge art so the (synchronous) card draw can use it. */
export function useBadgeImages(paths: string[]): Array<HTMLImageElement | null> {
  const [images, setImages] = useState<Array<HTMLImageElement | null>>(() =>
    paths.map(readyBadgeImage),
  );

  useEffect(() => {
    if (paths.length === 0) {
      setImages([]);
      return;
    }

    let cancelled = false;
    const loadedListeners: Array<{ image: HTMLImageElement; listener: () => void }> = [];
    const refresh = () => {
      if (cancelled) return;
      setImages((previous) => {
        const next = paths.map(readyBadgeImage);
        const unchanged =
          previous.length === next.length && previous.every((image, i) => image === next[i]);
        return unchanged ? previous : next;
      });
    };

    for (const path of paths) {
      let image = badgeImageCache.get(path);
      if (!image) {
        image = new Image();
        image.src = `${import.meta.env.BASE_URL}${path}`;
        badgeImageCache.set(path, image);
      }
      if (image.complete && image.naturalWidth > 0) continue;

      const listener = () => refresh();
      image.addEventListener('load', listener);
      loadedListeners.push({ image, listener });
    }

    refresh();

    return () => {
      cancelled = true;
      for (const { image, listener } of loadedListeners) {
        image.removeEventListener('load', listener);
      }
    };
  }, [paths]);

  return images;
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
