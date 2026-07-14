import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useKeyedFade } from './useKeyedFade';

const HIDDEN = 'hidden';

describe('useKeyedFade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays hidden after committing to a non-visible key', () => {
    const { result, rerender } = renderHook(
      ({ key }) => useKeyedFade(key, 300, (value) => value !== HIDDEN),
      { initialProps: { key: 'community' } },
    );

    rerender({ key: HIDDEN });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.displayKey).toBe(HIDDEN);
    expect(result.current.isVisible).toBe(false);
  });
});
