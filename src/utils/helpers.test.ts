import { describe, expect, it } from 'vitest';
import { formatHours, getMarathonOrder, parseTimeToHours, rgbToHex } from './helpers';
import type { AllStats } from '../types';

describe('parseTimeToHours', () => {
  it('parses h:mm:ss', () => {
    expect(parseTimeToHours('2:30:00')).toBeCloseTo(2.5);
  });

  it('parses h:mm', () => {
    expect(parseTimeToHours('1:15')).toBeCloseTo(1.25);
  });

  it('returns 0 for empty input', () => {
    expect(parseTimeToHours('')).toBe(0);
    expect(parseTimeToHours(null)).toBe(0);
  });
});

describe('formatHours', () => {
  it('formats fractional hours', () => {
    expect(formatHours(2.5)).toBe('2h 30m');
  });
});

describe('getMarathonOrder', () => {
  it('sorts marathons chronologically by season', () => {
    const allStats: AllStats = {
      'Summer 2025': [],
      'Winter 2024': [],
      'Spring 2025': [],
    };

    expect(getMarathonOrder(allStats)).toEqual(['Winter 2024', 'Spring 2025', 'Summer 2025']);
  });
});

describe('rgbToHex', () => {
  it('converts rgb strings to hex', () => {
    expect(rgbToHex('rgb(255, 0, 170)')).toBe('#ff00aa');
  });

  it('returns the original value when not rgb', () => {
    expect(rgbToHex('#ff00aa')).toBe('#ff00aa');
  });
});
