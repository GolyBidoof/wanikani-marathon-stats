import { describe, expect, it } from 'vitest';
import { findCanonicalUsername } from './username';

describe('findCanonicalUsername', () => {
  const users = ['GolyBidoof', 'Alice', 'Beyond_Sleepy'];

  it('matches regardless of case', () => {
    expect(findCanonicalUsername(users, 'golybidoof')).toBe('GolyBidoof');
    expect(findCanonicalUsername(users, 'ALICE')).toBe('Alice');
  });

  it('returns undefined when no match exists', () => {
    expect(findCanonicalUsername(users, 'missing')).toBeUndefined();
  });
});
