import { describe, expect, it } from 'vitest';
import { formatLastUpdated } from './formatDate';

describe('formatLastUpdated', () => {
  it('returns the original string for invalid dates', () => {
    expect(formatLastUpdated('not-a-date')).toBe('not-a-date');
  });

  it('formats valid ISO date strings', () => {
    const formatted = formatLastUpdated('2026-07-14');

    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/14/);
  });
});
