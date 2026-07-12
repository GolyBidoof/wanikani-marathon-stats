import { AllStats } from '../types';

export function parseTimeToHours(timeStr: string | undefined | null): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length >= 2) {
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    return h + m / 60 + s / 3600;
  }
  return parseFloat(timeStr) || 0;
}

export function formatHours(time: number): string {
  const totalMinutes = Math.round(time * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function getMarathonOrder(allStats: AllStats | undefined | null): string[] {
  if (!allStats) return [];
  return Object.keys(allStats).sort((a, b) => {
    const getVal = (s: string) => {
      const [season, year] = s.split(' ');
      const seasonScore = { Winter: 4, Fall: 3, Autumn: 3, Summer: 2, Spring: 1 }[season] || 0;
      return parseInt(year) * 10 + seasonScore;
    };
    return getVal(a) - getVal(b);
  });
}

export function rgbToHex(rgb: string | undefined | null): string {
  if (!rgb) return '';
  const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return rgb;
  return '#' + [1, 2, 3].map((i) => parseInt(m[i]).toString(16).padStart(2, '0')).join('');
}
