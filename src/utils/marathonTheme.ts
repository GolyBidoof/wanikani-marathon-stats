import { gifBackgrounds } from '../constants';
import { getMarathonOrder } from './helpers';
import { userParticipatedInMarathon } from './statsQueries';
import type { AllStats } from '../types';

export interface MarathonTheme {
  name: string;
  gif: string;
}

export function marathonNameToGif(marathonName: string): string {
  return marathonName.toLowerCase().replace(' ', '') + '.gif';
}

export function findMarathonByGif(allStats: AllStats, gifFilename: string): string {
  const marathonNames = getMarathonOrder(allStats);
  return (
    marathonNames.find((name) => marathonNameToGif(name) === gifFilename) || marathonNames[0] || ''
  );
}

export function getAvailableThemes(allStats: AllStats, username = ''): MarathonTheme[] {
  return getMarathonOrder(allStats)
    .map((name) => ({ name, gif: marathonNameToGif(name) }))
    .filter((theme) => {
      if (!gifBackgrounds.includes(theme.gif)) return false;
      if (!username) return true;
      return userParticipatedInMarathon(allStats, theme.name, username);
    });
}
