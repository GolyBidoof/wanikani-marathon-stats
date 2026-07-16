import { describe, expect, it } from 'vitest';
import { shouldPinWhileChartBelow } from './achievementCardPin';

describe('shouldPinWhileChartBelow', () => {
  it('pins only while the customizer is open and the chart is still below', () => {
    expect(shouldPinWhileChartBelow(true, 900, 800)).toBe(true);
    expect(shouldPinWhileChartBelow(true, 700, 800)).toBe(false);
    expect(shouldPinWhileChartBelow(true, -200, 800)).toBe(false);
    expect(shouldPinWhileChartBelow(false, 900, 800)).toBe(false);
  });
});
