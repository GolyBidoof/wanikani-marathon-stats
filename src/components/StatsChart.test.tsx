import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import StatsChart from './StatsChart';
import { StoreProvider } from '../hooks/StoreContext';
import { useAppStore } from '../store/appStore';
import type { AllStats } from '../types';
import i18n from '../i18n';

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
    useAppStore.setState({
      currentQuery: '',
      searchDraft: '',
      volumeConversion: {
        enabled: false,
        displayAs: 'chars',
        charsPerPage: 500,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('supports multi-select metrics, compare-shapes mode, and passes axe', async () => {
    const { container } = render(
      <StoreProvider allUsers={['Alice']}>
        <StatsChart allStats={sampleStats} allUsers={['Alice']} />
      </StoreProvider>,
    );

    expect(screen.getByRole('toolbar', { name: 'Chart metrics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Time' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Pages' }));
    fireEvent.click(screen.getByRole('button', { name: 'Characters' }));

    expect(screen.getByRole('button', { name: 'Pages' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Characters' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/3 metrics/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Compare shapes'));
    expect(screen.getByLabelText('Compare shapes')).toBeChecked();
    expect(screen.getByText(/normalized/i)).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows Combined for a user only when volume conversion is enabled', () => {
    useAppStore.setState({
      currentQuery: 'Alice',
      searchDraft: 'Alice',
      volumeConversion: {
        enabled: true,
        displayAs: 'chars',
        charsPerPage: 500,
      },
    });

    const { container, rerender } = render(
      <StoreProvider allUsers={['Alice']}>
        <StatsChart allStats={sampleStats} allUsers={['Alice']} />
      </StoreProvider>,
    );

    expect(container.querySelector('#chart-metric-volume')).toBeTruthy();
    expect(container.querySelector('#chart-metric-pages')).toBeTruthy();
    expect(container.querySelector('#chart-metric-characters')).toBeTruthy();
    expect(container.querySelector('#chart-metric-participants')).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();

    useAppStore.setState({
      volumeConversion: {
        enabled: false,
        displayAs: 'chars',
        charsPerPage: 500,
      },
    });
    rerender(
      <StoreProvider allUsers={['Alice']}>
        <StatsChart allStats={sampleStats} allUsers={['Alice']} />
      </StoreProvider>,
    );
    expect(container.querySelector('#chart-metric-volume')).toBeNull();
  });

  it('hides Combined on the community chart even if conversion prefs are on', () => {
    useAppStore.setState({
      currentQuery: '',
      searchDraft: '',
      volumeConversion: {
        enabled: true,
        displayAs: 'chars',
        charsPerPage: 500,
      },
    });

    const { container } = render(
      <StoreProvider allUsers={['Alice']}>
        <StatsChart allStats={sampleStats} allUsers={['Alice']} />
      </StoreProvider>,
    );

    expect(container.querySelector('#chart-metric-volume')).toBeNull();
    expect(container.querySelector('#chart-metric-participants')).toBeTruthy();
  });

  it('updates chart controls when the app language changes', async () => {
    const { rerender } = render(
      <StoreProvider allUsers={['Alice']}>
        <StatsChart allStats={sampleStats} allUsers={['Alice']} />
      </StoreProvider>,
    );

    await i18n.changeLanguage('ja');
    rerender(
      <StoreProvider allUsers={['Alice']}>
        <StatsChart allStats={sampleStats} allUsers={['Alice']} />
      </StoreProvider>,
    );

    expect(screen.getByRole('toolbar', { name: 'チャートの指標' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '読書時間' })).toBeInTheDocument();
  });
});
