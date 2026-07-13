import { useCallback, type KeyboardEvent } from 'react';
import type { ChartMetric } from '../types';

export function useChartTabKeyboard(
  tabs: ChartMetric[],
  activeTab: ChartMetric,
  onSelect: (metric: ChartMetric) => void,
) {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex === null) return;

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      onSelect(nextTab);
      document.getElementById(`chart-tab-${nextTab}`)?.focus();
    },
    [activeTab, onSelect, tabs],
  );
}
