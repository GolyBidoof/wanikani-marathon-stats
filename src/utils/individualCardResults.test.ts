import { describe, expect, it } from 'vitest';
import { getResultsViewForQuery, parseResultsContentKey } from './individualCardResults';

describe('parseResultsContentKey', () => {
  it('splits query and view from a content key', () => {
    expect(parseResultsContentKey('Alice:cards')).toEqual({
      searchQuery: 'Alice',
      resultsView: 'cards',
    });
  });
});

describe('getResultsViewForQuery', () => {
  const allStats = {
    'Winter 2025': [{ user: 'Alice', time: '1:00', pages: 10, characters: 1000, sources: 1 }],
  };
  const allUsers = ['Alice'];

  it('returns cards when the user has marathon history', () => {
    expect(getResultsViewForQuery('Alice', allStats, allUsers)).toBe('cards');
  });

  it('returns placeholder for partial matches', () => {
    expect(getResultsViewForQuery('Al', allStats, allUsers)).toBe('placeholder');
  });
});
