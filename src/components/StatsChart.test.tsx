import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import StatsChart from './StatsChart';
import { StoreProvider } from '../hooks/StoreContext';
import type { AllStats } from '../types';

vi.mock('../hooks/useHistoryChart', () => ({
  useHistoryChart: () => ({
    containerRef: { current: null },
    canvasRef: { current: null },
  }),
}));

const sampleStats: AllStats = {
  'Summer 2025': [{ user: 'Alice', time: '01:00:00', pages: 10, characters: 1000, sources: 1 }],
  'Winter 2025': [{ user: 'Alice', time: '02:30:00', pages: 20, characters: 2000, sources: 2 }],
};

describe('StatsChart', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes tablist semantics, chart description, and keyboard navigation', async () => {
    const { container } = render(
      <StoreProvider allUsers={['Alice']}>
        <StatsChart allStats={sampleStats} allUsers={['Alice']} />
      </StoreProvider>,
    );

    expect(screen.getByRole('tablist', { name: 'Chart metric' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Time' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Pages' })).toHaveAttribute('tabIndex', '-1');

    const description = screen.getByText(/Line chart of Time across 2 marathons/i);
    expect(description).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-labelledby', 'chart-description');

    const participantsTab = screen.getByRole('tab', { name: 'Participants' });
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(participantsTab).toHaveAttribute('aria-selected', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });
});
