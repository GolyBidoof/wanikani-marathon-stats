import { describe, expect, it } from 'vitest';
import { getMarathonThreadUrl } from './marathonThreads';

describe('marathonThreads', () => {
  it('returns the community thread for known marathons', () => {
    expect(getMarathonThreadUrl('Summer 2024')).toBe('https://community.wanikani.com/t/66274');
    expect(getMarathonThreadUrl('Spring 2026')).toBe('https://community.wanikani.com/t/73789');
    expect(getMarathonThreadUrl('Summer 2026')).toBe('https://community.wanikani.com/t/74572');
  });

  it('returns null for unknown marathons', () => {
    expect(getMarathonThreadUrl('Winter 2099')).toBeNull();
  });
});
