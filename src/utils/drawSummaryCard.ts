import { CANVAS_LAYOUT, seasonEmojis } from '../constants';
import {
  cardCopy,
  formatHoursForCard,
  formatSeasonLabel,
  formatCardTitle,
  formatCardNumber,
  formatSidebarYear,
} from '../constants/cardCopy';
import { getMarathonOrder, parseTimeToHours } from './helpers';
import { findUserEntry } from './statsQueries';
import {
  getUnifiedVolume,
  isVolumeConversionActive,
  replacePagesCharsWithVolume,
} from './volumeConversion';
import type {
  AllStats,
  CardLanguage,
  JaCardNumberStyle,
  MetricName,
  NicknameCase,
  VolumeConversionConfig,
} from '../types';

export interface SummaryCardState {
  name: string;
  time: number;
  count: number;
  pages: number;
  chars: number;
  volume: number | null;
  sources: number;
  history: string[];
}

export interface SummaryDrawContext {
  state: SummaryCardState;
  currentQuery: string;
  accentColor: string;
  sortMode: string;
  showHistory: boolean;
  enabledMetrics: Set<MetricName>;
  metricsOrder: MetricName[];
  excludedMarathons: Set<string>;
  allStats: AllStats;
  cardLanguage: CardLanguage;
  cardNicknameCase: NicknameCase;
  cardJaNumberStyle: JaCardNumberStyle;
  cardRoundNumbers: boolean;
  volumeConversion: VolumeConversionConfig;
}

function withJapaneseFonts(font: string, language: CardLanguage): string {
  if (language === 'en') return font;
  return font.replace(
    'Outfit, Open Sans, sans-serif',
    "Outfit, 'Hiragino Sans', 'Noto Sans JP', sans-serif",
  );
}

function getSidebarHeaderLabel(
  allStats: AllStats,
  excluded: Set<string>,
  language: CardLanguage,
  jaNumberStyle: JaCardNumberStyle,
) {
  const copy = cardCopy[language];
  const allMarathons = getMarathonOrder(allStats);
  const includedMarathons = allMarathons.filter((marathon) => !excluded.has(marathon));

  if (includedMarathons.length === 0) return copy.sidebarNone;
  if (includedMarathons.length === allMarathons.length) return copy.sidebarAllTime;

  const recentMarathons = allMarathons.slice(-4);
  if (
    includedMarathons.length === 4 &&
    includedMarathons.every((m) => recentMarathons.includes(m))
  ) {
    return copy.sidebarPastYear;
  }

  const years = includedMarathons.map((marathon) => marathon.split(' ').pop()!);
  const uniqueYears = [...new Set(years)];
  if (uniqueYears.length === 1) {
    const year = uniqueYears[0];
    const yearMarathons = allMarathons.filter((marathon) => marathon.endsWith(year));
    if (includedMarathons.length === yearMarathons.length) {
      return language === 'ja' ? formatSidebarYear(year, jaNumberStyle) : `YEAR ${year}`;
    }
  }

  return copy.sidebarManual;
}

function drawBackgroundImage(
  canvasCtx: CanvasRenderingContext2D,
  bgImage: CanvasImageSource | null,
) {
  if (!bgImage || !('width' in bgImage) || !('height' in bgImage)) return;

  const bgWidth = (bgImage as HTMLCanvasElement).width;
  const bgHeight = (bgImage as HTMLCanvasElement).height;
  if (bgWidth <= 0 || bgHeight <= 0) return;

  const imageRatio = bgWidth / bgHeight;
  const canvasRatio = CANVAS_LAYOUT.width / CANVAS_LAYOUT.height;
  let drawWidth: number;
  let drawHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (imageRatio > canvasRatio) {
    drawHeight = CANVAS_LAYOUT.height;
    drawWidth = bgWidth * (CANVAS_LAYOUT.height / bgHeight);
    offsetX = (CANVAS_LAYOUT.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = CANVAS_LAYOUT.width;
    drawHeight = bgHeight * (CANVAS_LAYOUT.width / bgWidth);
    offsetX = 0;
    offsetY = (CANVAS_LAYOUT.height - drawHeight) / 2;
  }

  canvasCtx.drawImage(
    bgImage,
    Math.round(offsetX),
    Math.round(offsetY),
    Math.round(drawWidth),
    Math.round(drawHeight),
  );
}

function drawCardChrome(canvasCtx: CanvasRenderingContext2D, accentColor: string) {
  const gradient = canvasCtx.createLinearGradient(0, 0, CANVAS_LAYOUT.width, 0);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  canvasCtx.fillStyle = gradient;
  canvasCtx.fillRect(0, 0, CANVAS_LAYOUT.width, CANVAS_LAYOUT.height);

  canvasCtx.shadowColor = 'rgba(0, 0, 0, 1)';
  canvasCtx.shadowBlur = 12;
  canvasCtx.shadowOffsetY = 2;
  canvasCtx.strokeStyle = accentColor;
  canvasCtx.lineWidth = CANVAS_LAYOUT.borderWidth;
  canvasCtx.strokeRect(
    CANVAS_LAYOUT.borderInset,
    CANVAS_LAYOUT.borderInset,
    CANVAS_LAYOUT.width - CANVAS_LAYOUT.borderInset * 2,
    CANVAS_LAYOUT.height - CANVAS_LAYOUT.borderInset * 2,
  );
}

function drawHeaderSection(canvasCtx: CanvasRenderingContext2D, ctx: SummaryDrawContext) {
  const { state, currentQuery, cardLanguage, cardNicknameCase, cardJaNumberStyle } = ctx;
  const copy = cardCopy[cardLanguage];

  canvasCtx.textAlign = 'left';
  canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontTitle, cardLanguage);
  canvasCtx.fillStyle = '#ffffff';
  canvasCtx.fillText(
    formatCardTitle(
      state.name,
      cardLanguage,
      Boolean(currentQuery),
      cardNicknameCase,
      cardJaNumberStyle,
    ),
    CANVAS_LAYOUT.leftX,
    85,
  );

  canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontTagline, cardLanguage);
  canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  canvasCtx.fillText(copy.tagline, CANVAS_LAYOUT.leftX, 110);
}

function drawCenterTime(canvasCtx: CanvasRenderingContext2D, ctx: SummaryDrawContext) {
  const { state, cardLanguage, cardJaNumberStyle, accentColor } = ctx;
  const copy = cardCopy[cardLanguage];

  canvasCtx.textAlign = 'center';
  canvasCtx.shadowBlur = 15;
  canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontTimeBig, cardLanguage);
  canvasCtx.fillStyle = '#ffffff';
  canvasCtx.fillText(
    formatHoursForCard(state.time, cardLanguage, cardJaNumberStyle),
    CANVAS_LAYOUT.width / 2,
    220,
  );

  canvasCtx.shadowBlur = 5;
  canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontTimeSub, cardLanguage);
  canvasCtx.fillStyle = accentColor;
  canvasCtx.fillText(copy.totalTimeRead, CANVAS_LAYOUT.width / 2, 250);
}

function drawStatsRow(canvasCtx: CanvasRenderingContext2D, ctx: SummaryDrawContext) {
  const {
    state,
    currentQuery,
    cardLanguage,
    cardJaNumberStyle,
    cardRoundNumbers,
    volumeConversion,
  } = ctx;
  const copy = cardCopy[cardLanguage];
  const useVolume = isVolumeConversionActive(volumeConversion, Boolean(currentQuery));

  const formatValue = (value: number) =>
    value > 0 ? formatCardNumber(value, cardLanguage, cardJaNumberStyle, cardRoundNumbers) : '–';

  const stats = useVolume
    ? [
        {
          label: copy.marathons,
          value: formatValue(state.count),
        },
        {
          label: volumeConversion.displayAs === 'pages' ? copy.pages : copy.chars,
          value: formatValue(state.volume ?? 0),
        },
        {
          label: copy.sources,
          value: formatValue(state.sources),
        },
      ]
    : [
        {
          label: currentQuery ? copy.marathons : copy.participants,
          value: formatValue(state.count),
        },
        { label: copy.pages, value: formatValue(state.pages) },
        { label: copy.chars, value: formatValue(state.chars) },
        { label: copy.sources, value: formatValue(state.sources) },
      ];

  const columnDivisor = stats.length + 1;
  const columnSpacing = CANVAS_LAYOUT.width / columnDivisor;
  stats.forEach((stat, index) => {
    const x = columnSpacing * (index + 1);
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.shadowBlur = 6;
    canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontStatValue, cardLanguage);
    canvasCtx.fillText(stat.value, x, CANVAS_LAYOUT.statY);
    canvasCtx.shadowBlur = 2;
    canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontStatLabel, cardLanguage);
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    canvasCtx.fillText(stat.label, x, CANVAS_LAYOUT.statY + 18);
  });
}

function buildHistoryMetricLine(marathonName: string, ctx: SummaryDrawContext): string {
  const {
    allStats,
    currentQuery,
    cardLanguage,
    cardJaNumberStyle,
    cardRoundNumbers,
    metricsOrder,
    enabledMetrics,
    volumeConversion,
  } = ctx;
  const copy = cardCopy[cardLanguage];
  const entry = findUserEntry(allStats, marathonName, currentQuery);
  if (!entry) return '';

  const numberOptions = { jaNumberStyle: cardJaNumberStyle, roundNumbers: cardRoundNumbers };
  const useVolume = isVolumeConversionActive(volumeConversion, Boolean(currentQuery));
  const effectiveOrder = (
    useVolume ? replacePagesCharsWithVolume(metricsOrder) : metricsOrder
  ) as MetricName[];
  const parts: string[] = [];

  for (const metric of effectiveOrder) {
    if (!enabledMetrics.has(metric)) continue;

    if (metric === 'time' && entry.time) {
      parts.push(formatHoursForCard(parseTimeToHours(entry.time), cardLanguage, cardJaNumberStyle));
    } else if (useVolume && metric === 'volume') {
      const volume = getUnifiedVolume(
        parseInt(String(entry.pages)) || 0,
        parseInt(String(entry.characters)) || 0,
        volumeConversion.displayAs,
        volumeConversion.charsPerPage,
      );
      if (volume > 0) {
        const unit =
          volumeConversion.displayAs === 'pages'
            ? copy.pagesUnit(volume, numberOptions)
            : copy.charsUnit(volume, numberOptions);
        parts.push(unit);
      }
    } else if (!useVolume && metric === 'pages' && entry.pages) {
      parts.push(copy.pagesUnit(parseInt(String(entry.pages)) || 0, numberOptions));
    } else if (!useVolume && metric === 'chars' && entry.characters) {
      parts.push(copy.charsUnit(parseInt(String(entry.characters)) || 0, numberOptions));
    } else if (metric === 'sources' && entry.sources) {
      parts.push(copy.sourcesUnit(parseInt(String(entry.sources)) || 0, numberOptions));
    }
  }

  return parts.join(' • ');
}

function drawHistorySidebar(canvasCtx: CanvasRenderingContext2D, ctx: SummaryDrawContext) {
  const {
    state,
    sortMode,
    showHistory,
    currentQuery,
    allStats,
    excludedMarathons,
    cardLanguage,
    cardJaNumberStyle,
    metricsOrder,
    enabledMetrics,
    accentColor,
    volumeConversion,
  } = ctx;

  if (!showHistory || state.history.length === 0 || !currentQuery) return;

  const useVolume = isVolumeConversionActive(volumeConversion, Boolean(currentQuery));
  const effectiveOrder = (
    useVolume ? replacePagesCharsWithVolume(metricsOrder) : metricsOrder
  ) as MetricName[];

  canvasCtx.textAlign = 'right';
  canvasCtx.shadowBlur = 0;
  let yPosition = CANVAS_LAYOUT.historyYStart;

  canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontHistoryHeader, cardLanguage);
  canvasCtx.fillStyle = accentColor;
  canvasCtx.fillText(
    getSidebarHeaderLabel(allStats, excludedMarathons, cardLanguage, cardJaNumberStyle),
    CANVAS_LAYOUT.rightX,
    yPosition,
  );
  yPosition += 18;

  const showingMetrics = effectiveOrder.some((metric) => enabledMetrics.has(metric));
  const lineHeight = showingMetrics ? 24 : 16;
  const displayLimit = showingMetrics ? 10 : 15;
  const isTruncated = state.history.length > displayLimit;
  const visibleHistory =
    isTruncated && sortMode === 'chrono'
      ? state.history.slice(-displayLimit)
      : state.history.slice(0, displayLimit);

  for (const marathonName of visibleHistory) {
    const [season, year] = marathonName.split(' ');
    const emoji = seasonEmojis[season] || '';
    const labelText = formatSeasonLabel(season, year, cardLanguage, cardJaNumberStyle);

    canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontHistoryLabel, cardLanguage);
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    canvasCtx.fillText(labelText, CANVAS_LAYOUT.rightX, yPosition);

    const textWidth = canvasCtx.measureText(labelText).width;
    canvasCtx.textAlign = 'left';
    canvasCtx.fillText(emoji, CANVAS_LAYOUT.rightX - textWidth - 18, yPosition);
    canvasCtx.textAlign = 'right';

    const metricLine = buildHistoryMetricLine(marathonName, ctx);
    if (metricLine) {
      canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontHistorySubline, cardLanguage);
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      canvasCtx.fillText(metricLine, CANVAS_LAYOUT.rightX, yPosition + 11);
    }

    yPosition += lineHeight;
  }

  if (isTruncated) {
    canvasCtx.font = withJapaneseFonts(CANVAS_LAYOUT.fontHistoryLabel, cardLanguage);
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    canvasCtx.fillText('...', CANVAS_LAYOUT.rightX, yPosition);
  }
}

export function drawSummaryCard(
  summaryCanvas: HTMLCanvasElement,
  bgImage: CanvasImageSource | null,
  ctx: SummaryDrawContext,
) {
  if (!ctx.state.name) return;

  const canvasCtx = summaryCanvas.getContext('2d');
  if (!canvasCtx) return;

  canvasCtx.shadowColor = 'transparent';
  canvasCtx.shadowBlur = 0;
  canvasCtx.shadowOffsetX = 0;
  canvasCtx.shadowOffsetY = 0;
  canvasCtx.fillStyle = '#232323';
  canvasCtx.fillRect(0, 0, summaryCanvas.width, summaryCanvas.height);

  canvasCtx.save();
  canvasCtx.scale(2, 2);

  drawBackgroundImage(canvasCtx, bgImage);
  drawCardChrome(canvasCtx, ctx.accentColor);
  drawHeaderSection(canvasCtx, ctx);
  drawCenterTime(canvasCtx, ctx);
  drawStatsRow(canvasCtx, ctx);
  drawHistorySidebar(canvasCtx, ctx);

  canvasCtx.restore();
}
