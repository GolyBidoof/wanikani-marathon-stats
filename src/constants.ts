import site from '../data/site.json';
import gifs from '../data/gifs.json';

export const SITE = {
  name: site.name,
  title: site.title,
  description: site.description,
  url: site.url,
  forumsUrl: site.forumsUrl,
  latestMarathon: site.latestMarathon,
} as const;

export const gifBackgrounds: string[] = gifs;

export const seasonEmojis: Record<string, string> = {
  Winter: '❄️',
  Summer: '☀️',
  Spring: '🌷',
  Fall: '🍁',
  Autumn: '🍁',
};

export const accentColors: string[] = [
  '#ff00aa',
  '#00aaff',
  '#a100ff',
  '#ff5f00',
  '#00d47e',
  '#ffb800',
];

export const CANVAS_LAYOUT = {
  width: 800,
  height: 400,
  borderInset: 25,
  borderWidth: 10,
  leftX: 60,
  rightX: 800 - 60,
  statY: 330,
  historyYStart: 75,
  fontTitle: '700 42px Outfit, Open Sans, sans-serif',
  fontTagline: '600 14px Outfit, Open Sans, sans-serif',
  fontTimeBig: '800 90px Outfit, Open Sans, sans-serif',
  fontTimeSub: '700 18px Outfit, Open Sans, sans-serif',
  fontStatValue: '700 26px Outfit, Open Sans, sans-serif',
  fontStatLabel: '600 10px Outfit, Open Sans, sans-serif',
  fontHistoryHeader: '800 10px Outfit, Open Sans, sans-serif',
  fontHistoryLabel: '600 11px Outfit, Open Sans, sans-serif',
  fontHistorySubline: '700 9px Outfit, Open Sans, sans-serif',
};
