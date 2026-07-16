import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
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

/** After docking, ignore layout thrash (customizer expand, scrollbar, spacer) briefly. */
const PIN_FREEZE_MS = 180;

function clearPinnedPositionStyles(section: HTMLElement) {
  section.style.removeProperty('left');
  section.style.removeProperty('width');
  section.style.removeProperty('top');
  section.style.removeProperty('bottom');
  section.style.removeProperty('transform');
}

function readAnchorBox(
  pinAnchor: HTMLElement | null,
  layoutAnchor: HTMLElement | null,
): { left: number; width: number } | null {
  const anchor = layoutAnchor ?? pinAnchor;
  if (!anchor) return null;

  const rect = anchor.getBoundingClientRect();
  const width = Math.max(0, rect.width);
  const maxLeft = Math.max(0, window.innerWidth - width);
  const left = Math.min(Math.max(0, rect.left), maxLeft);
  return { left, width };
}

/** Match the in-flow column’s left/width so pinning never recenters or resizes horizontally. */
function lockPinnedHorizontal(
  section: HTMLElement,
  pinAnchor: HTMLElement | null,
  layoutAnchor: HTMLElement | null,
  frozen?: { left: number; width: number } | null,
) {
  const box = frozen ?? readAnchorBox(pinAnchor, layoutAnchor);
  if (!box) return null;

  section.style.left = `${box.left}px`;
  section.style.width = `${box.width}px`;
  return box;
}

function readSafeAreaBottom(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-bottom')
    .trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function dockPinnedVertically(section: HTMLElement, height: number) {
  const inset = Math.max(8, readSafeAreaBottom() + 8);
  const top = Math.max(inset, window.innerHeight - height - inset);
  section.style.bottom = 'auto';
  section.style.top = `${top}px`;
  return top;
}

export default function StatsSummaryCard({
  allStats,
  allUsers,
  pinned = false,
  pinAnchorRef,
  layoutAnchorRef,
  onPinnedHeightChange,
}: DataProps & {
  pinned?: boolean;
  pinAnchorRef?: RefObject<HTMLDivElement | null>;
  layoutAnchorRef?: RefObject<HTMLDivElement | null>;
  onPinnedHeightChange?: (height: number) => void;
}) {
  const { currentBg } = useStore();
  const summaryRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
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

  // Dock immediately when requested; freeze geometry briefly so expand thrash can’t nudge it.
  const pinnedVisual = pinned && !isFullyHidden;
  const wasPinnedVisualRef = useRef(false);
  const freezeUntilRef = useRef(0);
  const frozenBoxRef = useRef<{ left: number; width: number } | null>(null);
  const frozenHeightRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || !onPinnedHeightChange) return;

    const reportHeight = () => {
      if (!pinnedVisual) {
        frozenHeightRef.current = null;
        onPinnedHeightChange(0);
        return;
      }

      // During freeze, keep the first measured dock height so the card doesn’t crawl.
      if (Date.now() < freezeUntilRef.current && frozenHeightRef.current != null) {
        onPinnedHeightChange(frozenHeightRef.current);
        return;
      }

      const height = section.getBoundingClientRect().height;
      frozenHeightRef.current = height;
      onPinnedHeightChange(height);
    };

    reportHeight();
    const observer = new ResizeObserver(reportHeight);
    observer.observe(section);
    return () => observer.disconnect();
  }, [pinnedVisual, onPinnedHeightChange, isInitialLoad, fadeClass]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || !pinnedVisual) {
      if (section && !pinnedVisual) clearPinnedPositionStyles(section);
      frozenBoxRef.current = null;
      freezeUntilRef.current = 0;
      return;
    }

    const syncPinnedBox = () => {
      const freezing = Date.now() < freezeUntilRef.current;
      const box = lockPinnedHorizontal(
        section,
        pinAnchorRef?.current ?? null,
        layoutAnchorRef?.current ?? null,
        freezing ? frozenBoxRef.current : null,
      );
      if (box && !freezing) frozenBoxRef.current = box;

      const height =
        freezing && frozenHeightRef.current != null
          ? frozenHeightRef.current
          : section.getBoundingClientRect().height;
      if (!freezing) frozenHeightRef.current = height;
      dockPinnedVertically(section, height);
    };

    syncPinnedBox();
    window.addEventListener('scroll', syncPinnedBox, { passive: true });
    window.addEventListener('resize', syncPinnedBox);
    return () => {
      window.removeEventListener('scroll', syncPinnedBox);
      window.removeEventListener('resize', syncPinnedBox);
    };
  }, [pinnedVisual, pinAnchorRef, layoutAnchorRef]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const wasPinned = wasPinnedVisualRef.current;
    wasPinnedVisualRef.current = pinnedVisual;

    if (!section || wasPinned === pinnedVisual) return;

    section.getAnimations().forEach((animation) => animation.cancel());
    section.style.removeProperty('transform');

    if (pinnedVisual) {
      // Calculate dock geometry now, then ignore layout noise for PIN_FREEZE_MS.
      const box = lockPinnedHorizontal(
        section,
        pinAnchorRef?.current ?? null,
        layoutAnchorRef?.current ?? null,
      );
      frozenBoxRef.current = box;
      freezeUntilRef.current = Date.now() + PIN_FREEZE_MS;

      const applyDock = () => {
        const height = section.getBoundingClientRect().height;
        frozenHeightRef.current = height;
        dockPinnedVertically(section, height);
        onPinnedHeightChange?.(height);
      };

      applyDock();
      // Second pass after pinned chrome (padding/gap) is fully applied.
      requestAnimationFrame(applyDock);
      return;
    }

    clearPinnedPositionStyles(section);
    frozenBoxRef.current = null;
    frozenHeightRef.current = null;
    freezeUntilRef.current = 0;
  }, [pinnedVisual, pinAnchorRef, layoutAnchorRef, onPinnedHeightChange]);

  return (
    <section
      ref={sectionRef}
      className={[
        'summary-section',
        'content-fade',
        fadeClass,
        isFullyHidden ? 'summary-section--collapsed' : '',
        pinnedVisual ? 'summary-section--pinned' : '',
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
