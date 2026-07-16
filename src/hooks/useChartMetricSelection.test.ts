import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useChartMetricSelection } from './useChartMetricSelection';
import type { ChartMetric } from '../types';

const AVAILABLE: ChartMetric[] = ['time', 'pages', 'characters', 'sources'];

describe('useChartMetricSelection', () => {
  it('starts with time selected and can toggle multiple metrics', () => {
    const { result } = renderHook(() => useChartMetricSelection(AVAILABLE));

    expect(result.current.orderedSelectedMetrics).toEqual(['time']);

    act(() => {
      result.current.toggleMetric('pages');
      result.current.toggleMetric('characters');
    });

    expect(result.current.orderedSelectedMetrics).toEqual(['time', 'pages', 'characters']);
  });

  it('keeps at least one metric selected', () => {
    const { result } = renderHook(() => useChartMetricSelection(AVAILABLE));

    act(() => {
      result.current.toggleMetric('time');
    });

    expect(result.current.orderedSelectedMetrics).toEqual(['time']);
  });

  it('drops unavailable metrics when the option set changes', () => {
    const { result, rerender } = renderHook(({ available }) => useChartMetricSelection(available), {
      initialProps: { available: AVAILABLE },
    });

    act(() => {
      result.current.toggleMetric('pages');
    });

    rerender({ available: ['time', 'characters'] as ChartMetric[] });

    expect(result.current.orderedSelectedMetrics).toEqual(['time']);
  });
});
