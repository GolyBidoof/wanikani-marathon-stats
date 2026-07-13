import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../hooks/StoreContext';
import {
  useSummaryCardVisibility,
  useSummaryDrawContext,
  useGifBackground,
  HIDDEN_PROFILE_KEY,
} from '../hooks/useSummaryCard';
import { drawSummaryCard } from '../utils/drawSummaryCard';
import { buildUserUrl } from '../utils/urlUser';
import { buildAchievementCardDescription } from '../utils/a11yDescriptions';
import { useKeyedFade } from '../hooks/useKeyedFade';
import { CONTENT_FADE_MS } from '../hooks/useContentFade';
import type { DataProps } from '../types';

export default function StatsSummaryCard({ allStats, allUsers }: DataProps) {
  const { currentBg } = useStore();
  const summaryRef = useRef<HTMLCanvasElement>(null);
  const wasHiddenRef = useRef(false);
  const prevBgEpochRef = useRef(0);
  const lastDrawKeyRef = useRef('community');
  const [isSwappingBg, setIsSwappingBg] = useState(false);
  const [copying, setCopying] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { exactUsername, effectiveUsername, isCardHidden } = useSummaryCardVisibility(
    allStats,
    allUsers,
  );

  const targetKey = isCardHidden ? HIDDEN_PROFILE_KEY : effectiveUsername || 'community';
  const showProfileKey = useCallback((key: string) => key !== HIDDEN_PROFILE_KEY, []);
  const {
    fadeClass,
    onTransitionEnd,
    isVisible: isCardVisible,
    displayKey,
  } = useKeyedFade(targetKey, CONTENT_FADE_MS, showProfileKey);

  const drawKey = displayKey !== HIDDEN_PROFILE_KEY ? displayKey : null;
  if (drawKey) {
    lastDrawKeyRef.current = drawKey;
  }

  const drawContext = useSummaryDrawContext(lastDrawKeyRef.current, allStats, allUsers);
  const { activeBgRef, isInitialLoad, bgEpoch, resumeAnimator, setOnFrame } =
    useGifBackground(currentBg);

  const cardDescription = useMemo(
    () => buildAchievementCardDescription(drawContext),
    [drawContext],
  );

  const isTransitioning = targetKey !== displayKey;
  const isFullyHidden = displayKey === HIDDEN_PROFILE_KEY && !isCardVisible;

  const redrawCard = useCallback(() => {
    const summaryCanvas = summaryRef.current;
    const backgroundCanvas = activeBgRef.current;
    if (!summaryCanvas || !backgroundCanvas || isInitialLoad) return;
    if (!drawContext.state.name || backgroundCanvas.width === 0) return;
    drawSummaryCard(summaryCanvas, backgroundCanvas, drawContext);
  }, [activeBgRef, drawContext, isInitialLoad]);

  useLayoutEffect(() => {
    setOnFrame(() => {
      if (isCardVisible && !isInitialLoad && !isTransitioning && drawKey) redrawCard();
    });
  }, [redrawCard, setOnFrame, isCardVisible, isInitialLoad, isTransitioning, drawKey]);

  useLayoutEffect(() => {
    if (wasHiddenRef.current && !isCardHidden) {
      resumeAnimator();
    }
    wasHiddenRef.current = isCardHidden;
  }, [isCardHidden, resumeAnimator]);

  useLayoutEffect(() => {
    if (isCardHidden || isInitialLoad || !isCardVisible || isTransitioning || !drawKey) return;
    redrawCard();
  }, [
    isCardHidden,
    isInitialLoad,
    isCardVisible,
    isTransitioning,
    drawKey,
    redrawCard,
    drawContext,
  ]);

  useLayoutEffect(() => {
    if (bgEpoch <= prevBgEpochRef.current) return;

    const isBgSwap = prevBgEpochRef.current > 0;
    prevBgEpochRef.current = bgEpoch;

    if (!isBgSwap || isCardHidden || isInitialLoad || !drawKey) return;

    setIsSwappingBg(true);
    redrawCard();
  }, [bgEpoch, isCardHidden, isInitialLoad, drawKey, redrawCard]);

  const copyCanvas = async () => {
    const canvas = summaryRef.current;
    if (!canvas || isInitialLoad) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      alert('Failed to copy image. Try downloading instead.');
    }
  };

  const downloadCanvas = () => {
    const canvas = summaryRef.current;
    if (!canvas || isInitialLoad) return;

    const link = document.createElement('a');
    link.download = `${exactUsername || 'community'}_achievement.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyProfileLink = async () => {
    if (!exactUsername) return;

    try {
      await navigator.clipboard.writeText(buildUserUrl(exactUsername));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert('Failed to copy link.');
    }
  };

  const handleBgSwapAnimationEnd = () => {
    if (isSwappingBg) setIsSwappingBg(false);
  };

  const actionsDisabled = isInitialLoad || isCardHidden;

  return (
    <section
      className={[
        'summary-section',
        'content-fade',
        fadeClass,
        isFullyHidden ? 'summary-section--collapsed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Achievement card"
      aria-hidden={isFullyHidden || undefined}
      onTransitionEnd={onTransitionEnd}
    >
      <div
        className={[
          'canvas-wrapper',
          isInitialLoad ? 'canvas-wrapper-loading' : '',
          isSwappingBg ? 'canvas-bg-swapping' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        id="achievementCardOuter"
      >
        <canvas
          ref={summaryRef}
          id="summaryCardCanvas"
          width={1600}
          height={800}
          role="img"
          aria-label={cardDescription}
          onAnimationEnd={handleBgSwapAnimationEnd}
        />
        {isInitialLoad && (
          <div className="canvas-loading is-active" role="status" aria-live="polite">
            <div className="canvas-loading-shimmer" aria-hidden="true" />
            <span>Loading background…</span>
          </div>
        )}
      </div>

      <div className="button-group" role="group" aria-label="Achievement card actions">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {linkCopied
            ? 'Profile link copied to clipboard.'
            : copying
              ? 'Achievement card image copied to clipboard.'
              : ''}
        </p>
        {exactUsername && (
          <button
            type="button"
            className="action-btn action-btn-secondary"
            onClick={copyProfileLink}
            disabled={actionsDisabled}
          >
            {linkCopied ? 'Profile link copied!' : 'Copy profile link'}
          </button>
        )}
        <button
          type="button"
          className="action-btn"
          onClick={copyCanvas}
          disabled={actionsDisabled}
        >
          {copying ? 'Card image copied!' : 'Copy card image'}
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={downloadCanvas}
          disabled={actionsDisabled}
        >
          Download card image
        </button>
      </div>
    </section>
  );
}
