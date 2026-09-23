import { afterEach, describe, expect, it, vi } from 'vitest';
import { CANVAS_LAYOUT } from '../constants';
import { drawSummaryCard, type SummaryDrawContext } from './drawSummaryCard';

type RecordedOp =
  | { op: 'fill'; fillStyle: string }
  | { op: 'stroke'; strokeStyle: string; lineWidth: number }
  | { op: 'fillText'; text: string; x: number; y: number; textAlign: string }
  | { op: 'drawImage'; args: unknown[]; shadowBlur: number; shadowOffsetY: number };

const MEASURED_TITLE_WIDTH = 20;

function createMockCanvas() {
  const ops: RecordedOp[] = [];

  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    measureText: vi.fn(() => ({ width: MEASURED_TITLE_WIDTH })),
    fill(this: { fillStyle: string }) {
      ops.push({ op: 'fill', fillStyle: this.fillStyle });
    },
    stroke(this: { strokeStyle: string; lineWidth: number }) {
      ops.push({ op: 'stroke', strokeStyle: this.strokeStyle, lineWidth: this.lineWidth });
    },
    fillText(this: { textAlign: string }, text: string, x: number, y: number) {
      ops.push({ op: 'fillText', text, x, y, textAlign: this.textAlign });
    },
    drawImage(this: { shadowBlur: number; shadowOffsetY: number }, ...args: unknown[]) {
      ops.push({
        op: 'drawImage',
        args,
        shadowBlur: this.shadowBlur,
        shadowOffsetY: this.shadowOffsetY,
      });
    },
  };

  const canvas = {
    width: CANVAS_LAYOUT.width * 2,
    height: CANVAS_LAYOUT.height * 2,
    getContext: () => context,
  } as unknown as HTMLCanvasElement;

  return { canvas, ops };
}

function stubOffscreenCanvas() {
  const offscreen = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      globalCompositeOperation: '',
      fillStyle: '',
    }),
  };
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
    if (tagName === 'canvas') return offscreen as unknown as HTMLElement;
    return originalCreateElement(tagName);
  }) as typeof document.createElement);
  return offscreen;
}

function buildContext(overrides: Partial<SummaryDrawContext> = {}): SummaryDrawContext {
  return {
    state: {
      name: 'GolyBidoof',
      time: 12,
      count: 3,
      pages: 300,
      chars: 30000,
      volume: null,
      sources: 5,
      history: ['Summer 2026', 'Autumn 2026'],
      emoji: ['🦫'],
      emojiImage: null,
    },
    badgeImagePaths: ['badges/emoji/1f9ab.png'],
    badgeLabel: 'beaver',
    currentQuery: 'GolyBidoof',
    accentColor: '#ff00aa',
    sortMode: 'chrono',
    showHistory: true,
    enabledMetrics: new Set(['time']),
    metricsOrder: ['time'],
    enabledSummaryMetrics: new Set(['pages']),
    summaryMetricsOrder: ['pages'],
    excludedMarathons: new Set<string>(),
    allStats: {
      'Summer 2026': [{ user: 'GolyBidoof', time: '04:00:00', pages: 300, sources: 5 }],
      'Autumn 2026': [{ user: 'GolyBidoof', time: '08:00:00', pages: 300, sources: 5 }],
    },
    cardLanguage: 'en',
    cardNicknameCase: 'normal',
    cardJaNumberStyle: 'numbers',
    cardRoundNumbers: false,
    cardShowEmoji: true,
    volumeConversion: { enabled: false, displayAs: 'chars', charsPerPage: 400 },
    ...overrides,
  };
}

function slotCenterX(index: number) {
  return (
    CANVAS_LAYOUT.leftX +
    MEASURED_TITLE_WIDTH +
    CANVAS_LAYOUT.badgeGapX +
    index * (CANVAS_LAYOUT.badgeSlotSize + CANVAS_LAYOUT.badgeSlotGap) +
    CANVAS_LAYOUT.badgeSlotSize / 2
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('drawSummaryCard badge', () => {
  it('sits just past the end of the username with padding', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();
    const glyphArt = { naturalWidth: 72, naturalHeight: 72, width: 72, height: 72 };

    drawSummaryCard(canvas, null, buildContext(), [glyphArt as unknown as CanvasImageSource]);

    const drawn = ops.find((op) => op.op === 'drawImage' && op.args[0] === glyphArt);
    expect(drawn).toBeDefined();
    if (drawn?.op !== 'drawImage') throw new Error('expected a drawImage op');

    const [, x, , width] = drawn.args as [unknown, number, number, number];
    const titleEnd = CANVAS_LAYOUT.leftX + MEASURED_TITLE_WIDTH;
    expect(x).toBeGreaterThanOrEqual(titleEnd + CANVAS_LAYOUT.badgeGapX - 1);
    expect(x + width / 2).toBeCloseTo(slotCenterX(0), 5);
  });

  it('vertically centres the badge on the username', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();
    const glyphArt = { naturalWidth: 72, naturalHeight: 72, width: 72, height: 72 };

    drawSummaryCard(canvas, null, buildContext(), [glyphArt as unknown as CanvasImageSource]);

    const drawn = ops.find((op) => op.op === 'drawImage' && op.args[0] === glyphArt);
    if (drawn?.op !== 'drawImage') throw new Error('expected a drawImage op');
    const [, , y, , height] = drawn.args as [unknown, number, number, number, number];

    expect(y + height / 2).toBeCloseTo(
      CANVAS_LAYOUT.titleBaselineY + CANVAS_LAYOUT.badgeCenterOffsetY,
      5,
    );
  });

  it('draws no background box or border behind the badge', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();

    drawSummaryCard(canvas, null, buildContext(), [
      {
        naturalWidth: 72,
        naturalHeight: 72,
        width: 72,
        height: 72,
      } as unknown as CanvasImageSource,
    ]);

    expect(ops.filter((op) => op.op === 'fill')).toEqual([]);
    expect(ops.filter((op) => op.op === 'stroke')).toEqual([]);
  });

  it('traces an outline around the badge silhouette', () => {
    const offscreen = stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();
    const glyphArt = { naturalWidth: 72, naturalHeight: 72, width: 72, height: 72 };

    drawSummaryCard(canvas, null, buildContext(), [glyphArt as unknown as CanvasImageSource]);

    const outlineDraws = ops.filter((op) => op.op === 'drawImage' && op.args[0] === offscreen);
    expect(outlineDraws).toHaveLength(8);
    const offset = CANVAS_LAYOUT.badgeOutlineWidth;
    const glyphDraw = ops.find((op) => op.op === 'drawImage' && op.args[0] === glyphArt);
    if (glyphDraw?.op !== 'drawImage') throw new Error('expected a drawImage op');
    const [, glyphX, glyphY] = glyphDraw.args as [unknown, number, number];
    for (const outlineDraw of outlineDraws) {
      if (outlineDraw.op !== 'drawImage') throw new Error('expected a drawImage op');
      const [, x, y] = outlineDraw.args as [unknown, number, number];
      expect(Math.abs(x - glyphX)).toBeLessThanOrEqual(offset);
      expect(Math.abs(y - glyphY)).toBeLessThanOrEqual(offset);
    }
  });

  it('draws the badge art without inheriting a shadow from earlier sections', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();
    const glyphArt = { naturalWidth: 72, naturalHeight: 72, width: 72, height: 72 };

    drawSummaryCard(canvas, null, buildContext(), [glyphArt as unknown as CanvasImageSource]);

    const imageDraws = ops.filter((op) => op.op === 'drawImage');
    expect(imageDraws.length).toBeGreaterThan(0);
    for (const draw of imageDraws) {
      if (draw.op !== 'drawImage') throw new Error('expected a drawImage op');
      expect(draw.shadowBlur).toBe(0);
      expect(draw.shadowOffsetY).toBe(0);
    }
  });


  it('skips the badge when the reader has none', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();
    const context = buildContext();
    context.state.emoji = [];
    context.state.emojiImage = null;
    context.badgeImagePaths = [];

    drawSummaryCard(canvas, null, context, []);

    expect(ops.some((op) => op.op === 'fillText' && op.text === '🦫')).toBe(false);
    expect(ops.some((op) => op.op === 'drawImage')).toBe(false);
  });

  it('skips the badge when the card setting is off', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();

    drawSummaryCard(canvas, null, buildContext({ cardShowEmoji: false }), [
      { naturalWidth: 72, naturalHeight: 72 } as unknown as CanvasImageSource,
    ]);

    expect(ops.some((op) => op.op === 'fillText' && op.text === '🦫')).toBe(false);
    expect(ops.some((op) => op.op === 'drawImage')).toBe(false);
  });

  it('gives every badge its own slot after the name', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();
    const context = buildContext();
    context.state.emoji = ['🌿', '🍓'];
    context.badgeImagePaths = ['badges/emoji/1f33f.png', 'badges/emoji/1f353.png'];

    drawSummaryCard(canvas, null, context);

    const first = ops.find((op) => op.op === 'fillText' && op.text === '🌿');
    const second = ops.find((op) => op.op === 'fillText' && op.text === '🍓');
    if (first?.op !== 'fillText' || second?.op !== 'fillText') throw new Error('expected fillText');
    expect(first.x).toBeCloseTo(slotCenterX(0), 5);
    expect(second.x).toBeCloseTo(slotCenterX(1), 5);
  });

  it('contains a wide image badge inside its slot', () => {
    stubOffscreenCanvas();
    const { canvas, ops } = createMockCanvas();
    const image = { naturalWidth: 48, naturalHeight: 31, width: 48, height: 31 };
    const context = buildContext();
    context.state.emoji = [];
    context.state.emojiImage = 'badges/trunky_rolling.gif';
    context.badgeImagePaths = ['badges/trunky_rolling.gif'];

    drawSummaryCard(canvas, null, context, [image as unknown as CanvasImageSource]);

    const drawn = ops.find((op) => op.op === 'drawImage' && op.args[0] === image);
    if (drawn?.op !== 'drawImage') throw new Error('expected a drawImage op');
    const [, , , width, height] = drawn.args as [unknown, number, number, number, number];
    expect(width).toBeCloseTo(CANVAS_LAYOUT.badgeSlotSize, 5);
    expect(height).toBeCloseTo(CANVAS_LAYOUT.badgeSlotSize * (31 / 48), 5);
    expect(height).toBeLessThanOrEqual(CANVAS_LAYOUT.badgeSlotSize);
  });
});
