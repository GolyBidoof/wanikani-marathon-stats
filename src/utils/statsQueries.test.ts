import { describe, expect, it } from 'vitest';
import {
  computeCommunityTotals,
  computeUserTotals,
  findUserEntry,
  normalizeUsername,
  sortMarathonNames,
} from './statsQueries';
import type { AllStats } from '../types';

const sampleStats: AllStats = {
  'Winter 2025': [
    { user: 'Alice', time: '1:00', pages: 10, characters: 1000, sources: 2 },
    { user: 'Bob', time: '2:00', pages: 5, characters: 500, sources: 1 },
  ],
  'Summer 2025': [{ user: 'alice', time: '3:30', pages: 20, characters: 2000, sources: 3 }],
};

describe('normalizeUsername', () => {
  it('lowercases and trims usernames', () => {
    expect(normalizeUsername('  Alice  ')).toBe('alice');
  });
});

describe('findUserEntry', () => {
  it('matches usernames case-insensitively', () => {
    expect(findUserEntry(sampleStats, 'Winter 2025', 'alice')?.pages).toBe(10);
    expect(findUserEntry(sampleStats, 'Summer 2025', 'ALICE')?.pages).toBe(20);
  });

  it('returns undefined when no match exists', () => {
    expect(findUserEntry(sampleStats, 'Winter 2025', 'missing')).toBeUndefined();
  });
});

describe('computeCommunityTotals', () => {
  it('sums participant stats for a marathon', () => {
    const totals = computeCommunityTotals(sampleStats, 'Winter 2025');

    expect(totals.count).toBe(2);
    expect(totals.pages).toBe(15);
    expect(totals.chars).toBe(1500);
    expect(totals.sources).toBe(3);
    expect(totals.time).toBeCloseTo(3);
  });
});

describe('computeUserTotals', () => {
  it('aggregates a user across marathons case-insensitively', () => {
    const totals = computeUserTotals(sampleStats, 'ALICE', {
      filterTotals: false,
      excludedMarathons: new Set(),
    });

    expect(totals.count).toBe(2);
    expect(totals.pages).toBe(30);
    expect(totals.chars).toBe(3000);
    expect(totals.history).toEqual(['Summer 2025', 'Winter 2025']);
  });

  it('respects excluded marathons when filtering totals', () => {
    const totals = computeUserTotals(sampleStats, 'Alice', {
      filterTotals: true,
      excludedMarathons: new Set(['Winter 2025']),
    });

    expect(totals.count).toBe(1);
    expect(totals.pages).toBe(20);
  });
});

describe('sortMarathonNames', () => {
  it('sorts by metric value when in metric mode', () => {
    const sorted = sortMarathonNames(['Winter 2025', 'Summer 2025'], {
      sortMode: 'metric',
      sortMetric: 'pages',
      manualOrder: [],
      allStats: sampleStats,
      username: 'Alice',
    });

    expect(sorted[0]).toBe('Summer 2025');
  });
});
