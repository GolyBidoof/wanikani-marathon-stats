import { describe, expect, it } from 'vitest';
import { parseAllStats, parseUsers } from '../schemas/data';

describe('data schemas', () => {
  it('accepts valid stats payloads', () => {
    const stats = parseAllStats({
      'Winter 2025': [{ user: 'Alice', pages: 12, characters: '1000' }],
    });

    expect(stats['Winter 2025'][0].user).toBe('Alice');
  });

  it('rejects invalid stats payloads', () => {
    expect(() => parseAllStats({ bad: 'value' })).toThrow();
  });

  it('parses user lists', () => {
    expect(parseUsers(['Alice', 'Bob'])).toEqual(['Alice', 'Bob']);
  });
});
