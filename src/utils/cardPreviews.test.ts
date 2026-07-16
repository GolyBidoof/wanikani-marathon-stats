import { describe, expect, it } from 'vitest';
import { getMarathonAccentColor, getMarathonPreviewUrl } from './cardPreviews';

describe('cardPreviews', () => {
  it('returns a preview url and accent for known marathons', () => {
    expect(getMarathonPreviewUrl('Summer 2026')).toContain('card-previews/summer2026.webp');
    expect(getMarathonAccentColor('Summer 2026')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('falls back to season colors when a preview is missing', () => {
    expect(getMarathonAccentColor('Winter 2099')).toBe('#00aaff');
  });
});
