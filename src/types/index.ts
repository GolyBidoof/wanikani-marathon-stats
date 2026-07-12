import type { Dispatch, SetStateAction } from 'react';

export interface ParticipantEntry {
  user: string;
  time?: string;
  pages?: number | string;
  characters?: number | string;
  sources?: number | string;
  url?: string;
}

export type AllStats = Record<string, ParticipantEntry[]>;

export type MetricName = 'time' | 'pages' | 'chars' | 'sources' | 'volume';
export type ChartMetric = 'time' | 'participants' | 'characters' | 'pages' | 'sources';
export type SortMode = 'chrono' | 'metric' | 'manual';
export type CardLanguage = 'en' | 'ja';
export type NicknameCase = 'normal' | 'uppercase';
export type JaCardNumberStyle = 'words' | 'numbers';
export type VolumeDisplayUnit = 'pages' | 'chars';

export interface VolumeConversionConfig {
  enabled: boolean;
  displayAs: VolumeDisplayUnit;
  charsPerPage: number;
}

export interface StoreContextType {
  currentQuery: string;
  setCurrentQuery: (q: string) => void;
  searchDraft: string;
  setSearchDraft: (q: string) => void;
  currentBg: string;
  setCurrentBg: (bg: string) => void;
  currentAccentColor: string;
  setCurrentAccentColor: (color: string) => void;
  currentSortMode: SortMode;
  setCurrentSortMode: (mode: SortMode) => void;
  userMarathonsOrder: string[];
  setUserMarathonsOrder: Dispatch<SetStateAction<string[]>>;
  activeUserForOrder: string;
  setActiveUserForOrder: (user: string) => void;
  enabledMetrics: Set<MetricName>;
  setEnabledMetrics: Dispatch<SetStateAction<Set<MetricName>>>;
  toggleMetric: (metric: MetricName) => void;
  excludedMarathons: Set<string>;
  setExcludedMarathons: Dispatch<SetStateAction<Set<string>>>;
  toggleMarathon: (name: string) => void;
  userMetricsOrder: MetricName[];
  setUserMetricsOrder: (order: MetricName[]) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  filterTotals: boolean;
  setFilterTotals: (filter: boolean) => void;
  cardLanguage: CardLanguage;
  setCardLanguage: (language: CardLanguage) => void;
  cardNicknameCase: NicknameCase;
  setCardNicknameCase: (nicknameCase: NicknameCase) => void;
  cardJaNumberStyle: JaCardNumberStyle;
  setCardJaNumberStyle: (style: JaCardNumberStyle) => void;
  cardRoundNumbers: boolean;
  setCardRoundNumbers: (round: boolean) => void;
  volumeConversion: VolumeConversionConfig;
  setVolumeConversionEnabled: (enabled: boolean) => void;
  setVolumeDisplayAs: (displayAs: VolumeDisplayUnit) => void;
  setVolumeCharsPerPage: (charsPerPage: number) => void;
}

export interface AllStatsProps {
  allStats: AllStats;
}

export interface DataProps extends AllStatsProps {
  allUsers: string[];
}
