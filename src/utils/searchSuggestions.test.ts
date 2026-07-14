import { describe, expect, it } from 'vitest';
import { getSearchSuggestions } from './searchSuggestions';

describe('getSearchSuggestions', () => {
  const users = ['GolyBidoof', 'Alice', 'NihongoLearner19'];

  it('returns empty for blank or exact matches', () => {
    expect(getSearchSuggestions(users, '')).toEqual([]);
    expect(getSearchSuggestions(users, 'GolyBidoof')).toEqual([]);
    expect(getSearchSuggestions(users, 'golybidoof')).toEqual([]);
  });

  it('matches usernames case-insensitively', () => {
    expect(getSearchSuggestions(users, 'goly')).toEqual(['GolyBidoof']);
    expect(getSearchSuggestions(users, 'AL')).toEqual(['Alice']);
  });

  it('limits results', () => {
    expect(getSearchSuggestions(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'], 'a', 3)).toHaveLength(3);
  });
});
