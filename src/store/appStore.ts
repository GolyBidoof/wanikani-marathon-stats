import { create } from 'zustand';
import type { SetStateAction } from 'react';
import type {
  AppLanguage,
  CardLanguage,
  JaCardNumberStyle,
  MetricName,
  NicknameCase,
  SortMode,
  StoreContextType,
  SummaryMetricName,
  VolumeDisplayUnit,
} from '../types';
import {
  DEFAULT_CHARS_PER_PAGE,
  metricsOrderForConversion,
  migrateEnabledMetricsForConversion,
} from '../utils/volumeConversion';
import { loadPreferences, getDefaultPreferences } from '../utils/preferences';
import i18n, { setAppDocumentLang } from '../i18n';

function createInitialAppearance() {
  const prefs = loadPreferences();
  const conversionEnabled = prefs.volumeConversion.enabled;
  const enabledMetrics = migrateEnabledMetricsForConversion(
    new Set(prefs.enabledMetrics),
    conversionEnabled,
  ) as Set<MetricName>;
  const enabledSummaryMetrics = migrateEnabledMetricsForConversion(
    new Set(prefs.enabledSummaryMetrics),
    conversionEnabled,
  ) as Set<SummaryMetricName>;

  void i18n.changeLanguage(prefs.appLanguage);
  setAppDocumentLang(prefs.appLanguage);

  return {
    currentBg: prefs.currentBg,
    currentAccentColor: prefs.currentAccentColor,
    currentSortMode: prefs.currentSortMode as SortMode,
    enabledMetrics,
    enabledSummaryMetrics,
    userMetricsOrder: metricsOrderForConversion(
      prefs.userMetricsOrder,
      conversionEnabled,
    ) as MetricName[],
    summaryMetricsOrder: metricsOrderForConversion(
      prefs.summaryMetricsOrder,
      conversionEnabled,
    ) as SummaryMetricName[],
    showHistory: prefs.showHistory,
    filterTotals: prefs.filterTotals,
    appLanguage: prefs.appLanguage as AppLanguage,
    cardLanguage: prefs.cardLanguage as CardLanguage,
    cardNicknameCase: prefs.cardNicknameCase as NicknameCase,
    cardJaNumberStyle: prefs.cardJaNumberStyle as JaCardNumberStyle,
    cardRoundNumbers: prefs.cardRoundNumbers,
    volumeConversion: prefs.volumeConversion,
  };
}

const initial = createInitialAppearance();

function applySet<T>(value: SetStateAction<T>, current: T): T {
  return typeof value === 'function' ? (value as (prev: T) => T)(current) : value;
}

export const useAppStore = create<StoreContextType>((set, get) => ({
  currentQuery: '',
  setCurrentQuery: (query) => {
    const trimmed = query.trim();
    set({ currentQuery: trimmed, searchDraft: trimmed });
  },

  searchDraft: '',
  setSearchDraft: (query) => set({ searchDraft: query }),

  currentBg: initial.currentBg,
  setCurrentBg: (bg) => set({ currentBg: bg }),

  currentAccentColor: initial.currentAccentColor,
  setCurrentAccentColor: (color) => set({ currentAccentColor: color }),

  currentSortMode: initial.currentSortMode,
  setCurrentSortMode: (mode) => set({ currentSortMode: mode }),

  userMarathonsOrder: [],
  setUserMarathonsOrder: (order) =>
    set((state) => ({
      userMarathonsOrder: applySet(order, state.userMarathonsOrder),
    })),

  activeUserForOrder: '',
  setActiveUserForOrder: (user) => set({ activeUserForOrder: user }),

  enabledMetrics: initial.enabledMetrics,
  setEnabledMetrics: (metrics) =>
    set((state) => ({
      enabledMetrics: applySet(metrics, state.enabledMetrics) as Set<MetricName>,
    })),

  toggleMetric: (metric) =>
    set((state) => {
      const next = new Set(state.enabledMetrics);
      if (next.has(metric)) next.delete(metric);
      else next.add(metric);
      return { enabledMetrics: next };
    }),

  enabledSummaryMetrics: initial.enabledSummaryMetrics,
  setEnabledSummaryMetrics: (metrics) =>
    set((state) => ({
      enabledSummaryMetrics: applySet(
        metrics,
        state.enabledSummaryMetrics,
      ) as Set<SummaryMetricName>,
    })),

  toggleSummaryMetric: (metric) =>
    set((state) => {
      const next = new Set(state.enabledSummaryMetrics);
      if (next.has(metric)) next.delete(metric);
      else next.add(metric);
      return { enabledSummaryMetrics: next };
    }),

  excludedMarathons: new Set<string>(),
  setExcludedMarathons: (marathons) =>
    set((state) => ({
      excludedMarathons: applySet(marathons, state.excludedMarathons) as Set<string>,
    })),

  toggleMarathon: (name) =>
    set((state) => {
      const next = new Set(state.excludedMarathons);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { excludedMarathons: next };
    }),

  userMetricsOrder: initial.userMetricsOrder,
  setUserMetricsOrder: (order) => set({ userMetricsOrder: order }),

  summaryMetricsOrder: initial.summaryMetricsOrder,
  setSummaryMetricsOrder: (order) => set({ summaryMetricsOrder: order }),

  showHistory: initial.showHistory,
  setShowHistory: (show) => set({ showHistory: show }),

  filterTotals: initial.filterTotals,
  setFilterTotals: (filter) => set({ filterTotals: filter }),

  appLanguage: initial.appLanguage,
  setAppLanguage: (language) => {
    void i18n.changeLanguage(language);
    setAppDocumentLang(language);
    set({ appLanguage: language, cardLanguage: language });
  },

  cardLanguage: initial.cardLanguage,
  setCardLanguage: (language) => set({ cardLanguage: language }),

  cardNicknameCase: initial.cardNicknameCase,
  setCardNicknameCase: (nicknameCase) => set({ cardNicknameCase: nicknameCase }),

  cardJaNumberStyle: initial.cardJaNumberStyle,
  setCardJaNumberStyle: (style) => set({ cardJaNumberStyle: style }),

  cardRoundNumbers: initial.cardRoundNumbers,
  setCardRoundNumbers: (round) => set({ cardRoundNumbers: round }),

  volumeConversion: initial.volumeConversion,
  setVolumeConversionEnabled: (enabled) =>
    set((state) => ({
      volumeConversion: { ...state.volumeConversion, enabled },
      enabledMetrics: migrateEnabledMetricsForConversion(
        state.enabledMetrics,
        enabled,
      ) as Set<MetricName>,
      enabledSummaryMetrics: migrateEnabledMetricsForConversion(
        state.enabledSummaryMetrics,
        enabled,
      ) as Set<SummaryMetricName>,
      userMetricsOrder: metricsOrderForConversion(state.userMetricsOrder, enabled) as MetricName[],
      summaryMetricsOrder: metricsOrderForConversion(
        state.summaryMetricsOrder,
        enabled,
      ) as SummaryMetricName[],
    })),

  setVolumeDisplayAs: (displayAs: VolumeDisplayUnit) =>
    set((state) => ({
      volumeConversion: { ...state.volumeConversion, displayAs },
    })),

  setVolumeCharsPerPage: (charsPerPage) =>
    set((state) => {
      const safeValue =
        Number.isFinite(charsPerPage) && charsPerPage > 0
          ? Math.round(charsPerPage)
          : DEFAULT_CHARS_PER_PAGE;
      return { volumeConversion: { ...state.volumeConversion, charsPerPage: safeValue } };
    }),

  resetAchievementCardSettings: () => {
    const defaults = getDefaultPreferences();
    set({
      currentSortMode: defaults.currentSortMode,
      enabledMetrics: new Set(defaults.enabledMetrics),
      enabledSummaryMetrics: new Set(defaults.enabledSummaryMetrics),
      userMetricsOrder: [...defaults.userMetricsOrder],
      summaryMetricsOrder: [...defaults.summaryMetricsOrder],
      showHistory: defaults.showHistory,
      filterTotals: defaults.filterTotals,
      cardLanguage: get().appLanguage,
      cardNicknameCase: defaults.cardNicknameCase,
      cardJaNumberStyle: defaults.cardJaNumberStyle,
      cardRoundNumbers: defaults.cardRoundNumbers,
      volumeConversion: { ...defaults.volumeConversion },
      excludedMarathons: new Set(),
    });
  },
}));
