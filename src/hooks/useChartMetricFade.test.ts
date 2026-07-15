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

  it('finishes a pending metric change when another tab is clicked mid-fade', () => {
    const { result } = renderHook(() => useChartMetricFade());

    act(() => {
      result.current.requestMetricChange('pages');
    });

    act(() => {
      result.current.requestMetricChange('characters');
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.fadeState).toBe('visible');
    expect(result.current.chartMetric).toBe('characters');
    expect(result.current.activeTab).toBe('characters');
  });

  it('shows the chart again after switching profiles mid-fade', () => {
    const { result } = renderHook(() => useChartMetricFade());

    act(() => {
      result.current.requestMetricChange('pages');
    });

    act(() => {
      result.current.resetForProfileChange();
    });

    expect(result.current.fadeState).toBe('visible');
    expect(result.current.activeTab).toBe('pages');
  });
});
