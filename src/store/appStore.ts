import { create } from 'zustand';
import type { SetStateAction } from 'react';
import type {
  CardLanguage,
  JaCardNumberStyle,
  MetricName,
  NicknameCase,
  SortMode,
  StoreContextType,
  VolumeDisplayUnit,
} from '../types';
import {
  DEFAULT_CHARS_PER_PAGE,
  migrateEnabledMetricsForConversion,
} from '../utils/volumeConversion';
import { loadPreferences } from '../utils/preferences';

function createInitialAppearance() {
  const prefs = loadPreferences();
  const enabledMetrics = migrateEnabledMetricsForConversion(
    new Set(prefs.enabledMetrics),
    prefs.volumeConversion.enabled,
  ) as Set<MetricName>;

  return {
    currentBg: prefs.currentBg,
    currentAccentColor: prefs.currentAccentColor,
    currentSortMode: prefs.currentSortMode as SortMode,
    enabledMetrics,
    userMetricsOrder: prefs.userMetricsOrder,
    showHistory: prefs.showHistory,
    filterTotals: prefs.filterTotals,
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

export const useAppStore = create<StoreContextType>((set, _get) => ({
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

  showHistory: initial.showHistory,
  setShowHistory: (show) => set({ showHistory: show }),

  filterTotals: initial.filterTotals,
  setFilterTotals: (filter) => set({ filterTotals: filter }),

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
}));
