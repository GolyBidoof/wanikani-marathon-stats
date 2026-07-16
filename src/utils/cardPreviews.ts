import cardPreviews from '../../data/card-previews.json';
import { marathonNameToGif } from './marathonTheme';

export interface CardPreviewMeta {
  preview: string;
  accent: string;
  extracted: string;
}

const SEASON_FALLBACKS: Record<string, string> = {
  spring: '#ff00aa',
  summer: '#ffb800',
  winter: '#00aaff',
  fall: '#ff5f00',
  autumn: '#ff5f00',
};

const catalog = cardPreviews as Record<string, CardPreviewMeta>;

export function getCardPreviewMeta(marathonName: string): CardPreviewMeta | null {
  const gif = marathonNameToGif(marathonName);
  return catalog[gif] ?? null;
}

export function getMarathonAccentColor(marathonName: string, fallbackAccent?: string): string {
  const meta = getCardPreviewMeta(marathonName);
  if (meta?.accent) return meta.accent;

  const season = marathonName.split(' ')[0]?.toLowerCase() ?? '';
  return SEASON_FALLBACKS[season] ?? fallbackAccent ?? '#ff00aa';
}

export function getMarathonPreviewUrl(marathonName: string): string | null {
  const meta = getCardPreviewMeta(marathonName);
  if (!meta?.preview) return null;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${meta.preview.replace(/^\//, '')}`;
}
