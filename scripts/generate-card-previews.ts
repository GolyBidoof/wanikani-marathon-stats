#!/usr/bin/env node
/**
 * Extract a low-res static preview + accent color from each marathon GIF.
 *
 * Usage: npm run generate-card-previews
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PUBLIC_DIR, ROOT, writeJson } from './lib/marathonData.ts';

const PREVIEW_DIR = join(PUBLIC_DIR, 'card-previews');
const OUTPUT_JSON = join(ROOT, 'data', 'card-previews.json');
const PREVIEW_WIDTH = 320;

const SEASON_FALLBACKS: Record<string, string> = {
  spring: '#ff00aa',
  summer: '#ffb800',
  winter: '#00aaff',
  fall: '#ff5f00',
  autumn: '#ff5f00',
};

export type CardPreviewEntry = {
  preview: string;
  accent: string;
  extracted: string;
};

function seasonFromGif(filename: string): string {
  const match = filename.toLowerCase().match(/^(spring|summer|winter|fall|autumn)/);
  return match?.[1] ?? '';
}

function seasonFallback(filename: string): string {
  return SEASON_FALLBACKS[seasonFromGif(filename)] ?? '#ff00aa';
}

function hexFromRgb(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function rgbFromHex(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function mixHex(left: string, right: string, leftWeight: number): string {
  const [lr, lg, lb] = rgbFromHex(left);
  const [rr, rg, rb] = rgbFromHex(right);
  const w = Math.min(1, Math.max(0, leftWeight));
  return hexFromRgb(lr * w + rr * (1 - w), lg * w + rg * (1 - w), lb * w + rb * (1 - w));
}

/** Relative luminance-ish + chroma score for picking a usable UI accent. */
function accentScore(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (lightness < 0.18 || lightness > 0.82 || saturation < 0.18) return -1;
  // Prefer vivid mid tones that still read on dark UI.
  return saturation * 2 + (1 - Math.abs(lightness - 0.5)) + max / 255;
}

function extractAccentFromRaw(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): { hex: string; score: number } | null {
  const candidates: Array<{ score: number; r: number; g: number; b: number }> = [];
  const step = Math.max(1, Math.floor((width * height) / 1200));

  for (let i = 0; i < width * height; i += step) {
    const offset = i * channels;
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;
    const score = accentScore(r, g, b);
    if (score > 0) candidates.push({ score, r, g, b });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const topCount = Math.max(1, Math.ceil(candidates.length * 0.12));
  const top = candidates.slice(0, topCount);
  const r = top.reduce((sum, pixel) => sum + pixel.r, 0) / top.length;
  const g = top.reduce((sum, pixel) => sum + pixel.g, 0) / top.length;
  const b = top.reduce((sum, pixel) => sum + pixel.b, 0) / top.length;
  const score = top.reduce((sum, pixel) => sum + pixel.score, 0) / top.length;

  return { hex: hexFromRgb(r, g, b), score };
}

async function processGif(filename: string): Promise<CardPreviewEntry> {
  const gifPath = join(PUBLIC_DIR, filename);
  const base = filename.replace(/\.gif$/i, '');
  const previewFilename = `${base}.webp`;
  const previewPath = join(PREVIEW_DIR, previewFilename);
  const fallback = seasonFallback(filename);

  const image = sharp(gifPath, { animated: false, pages: 1 });
  const previewBuffer = await image
    .rotate()
    .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
    .webp({ quality: 62 })
    .toBuffer();

  await sharp(previewBuffer).toFile(previewPath);

  const sample = await sharp(previewBuffer)
    .resize(48, 48, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sampled = extractAccentFromRaw(
    sample.data,
    sample.info.width,
    sample.info.height,
    sample.info.channels,
  ) ?? { hex: fallback, score: 0 };

  // Lean on the season fallback when the frame is muted / low-chroma.
  const extractedWeight = Math.min(0.7, Math.max(0.25, sampled.score / 3.2));
  const accent = mixHex(sampled.hex, fallback, extractedWeight);

  return {
    preview: `card-previews/${previewFilename}`,
    accent,
    extracted: sampled.hex,
  };
}

async function main() {
  if (!existsSync(PREVIEW_DIR)) mkdirSync(PREVIEW_DIR, { recursive: true });

  const gifFiles = readdirSync(PUBLIC_DIR)
    .filter((name) => name.toLowerCase().endsWith('.gif'))
    .sort();

  if (gifFiles.length === 0) {
    throw new Error(`No GIFs found in ${PUBLIC_DIR}`);
  }

  const catalog: Record<string, CardPreviewEntry> = {};

  for (const filename of gifFiles) {
    process.stdout.write(`Generating preview for ${filename}… `);
    catalog[filename] = await processGif(filename);
    console.log(`${catalog[filename].accent} → ${catalog[filename].preview}`);
  }

  writeJson(OUTPUT_JSON, catalog);
  console.log(`Wrote ${OUTPUT_JSON} (${Object.keys(catalog).length} entries)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
