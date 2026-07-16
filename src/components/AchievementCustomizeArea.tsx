import { useEffect, useRef, useState } from 'react';
import CardCustomizer from './CardCustomizer';
import StatsSummaryCard from './StatsSummaryCard';
import { shouldPinWhileChartBelow } from '../utils/achievementCardPin';
import type { DataProps } from '../types';

export default function AchievementCustomizeArea({ allStats, allUsers }: DataProps) {
  const [customizerExpanded, setCustomizerExpanded] = useState(false);
  const [chartStillBelow, setChartStillBelow] = useState(true);
  const [pinSpacerHeight, setPinSpacerHeight] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const pinAnchorRef = useRef<HTMLDivElement>(null);

  const pinActive = customizerExpanded && chartStillBelow;

  useEffect(() => {
    if (!customizerExpanded) {
      setChartStillBelow(true);
      setPinSpacerHeight(0);
      return;
    }

    let observer: IntersectionObserver | null = null;
    let pollId = 0;
    let cancelled = false;

    const syncFromChart = (chart: Element) => {
      const rect = chart.getBoundingClientRect();
      setChartStillBelow(shouldPinWhileChartBelow(true, rect.top, window.innerHeight));
    };

    const attach = () => {
      const chart = document.getElementById('chart-section');
      if (!chart || cancelled) return false;

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          const viewportBottom = entry.rootBounds?.bottom ?? window.innerHeight;
          setChartStillBelow(
            shouldPinWhileChartBelow(true, entry.boundingClientRect.top, viewportBottom),
          );
        },
        // Multiple thresholds so we keep getting updates while the chart crosses the viewport.
        { threshold: [0, 0.01, 0.1, 0.5, 1] },
      );
      observer.observe(chart);
      syncFromChart(chart);
      return true;
    };

    if (!attach()) {
      pollId = window.setInterval(() => {
        if (attach()) window.clearInterval(pollId);
      }, 100);
    }

    // Scroll can move the chart from "below" to "above" without an intersection flip
    // if the jump is large; keep pin state honest while customizing.
    const onScrollOrResize = () => {
      const chart = document.getElementById('chart-section');
      if (chart) syncFromChart(chart);
    };
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      cancelled = true;
      if (pollId) window.clearInterval(pollId);
      observer?.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [customizerExpanded]);

  useEffect(() => {
    if (!pinActive) setPinSpacerHeight(0);
  }, [pinActive]);

  return (
    <div
      ref={areaRef}
      className={`achievement-customize-area${pinActive ? ' is-customizing' : ''}`}
    >
      <CardCustomizer
        allStats={allStats}
        allUsers={allUsers}
        expanded={customizerExpanded}
        onExpandedChange={setCustomizerExpanded}
      />
      {(pinActive || pinSpacerHeight > 0) && (
        <div
          ref={pinAnchorRef}
          className="summary-pin-spacer"
          style={{ height: pinSpacerHeight }}
          aria-hidden="true"
        />
      )}
      <StatsSummaryCard
        allStats={allStats}
        allUsers={allUsers}
        pinned={pinActive}
        pinAnchorRef={pinAnchorRef}
        layoutAnchorRef={areaRef}
        onPinnedHeightChange={setPinSpacerHeight}
      />
    </div>
  );
}
