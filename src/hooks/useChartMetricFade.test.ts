import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useChartMetricFade } from './useChartMetricFade';

describe('useChartMetricFade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the chart visible after an interrupted metric fade', () => {
    const { result } = renderHook(() => useChartMetricFade());

    act(() => {
      result.current.requestMetricChange('pages');
    });

    expect(result.current.fadeState).toBe('hidden');

    act(() => {
      result.current.resetChartFade();
    });

    expect(result.current.fadeState).toBe('visible');
    expect(result.current.chartMetric).toBe('pages');
    expect(result.current.activeTab).toBe('pages');
  });
});
