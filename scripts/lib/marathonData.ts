import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marathonNameToGifFilename } from '../../src/utils/parseMarathonTable.ts';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(scriptsDirectory, '../..');
export const DATA_DIR = join(ROOT, 'data');
export const PUBLIC_DIR = join(ROOT, 'public');

export const PATHS = {
  allStats: join(DATA_DIR, 'all_stats.json'),
  users: join(DATA_DIR, 'users.json'),
  meta: join(DATA_DIR, 'meta.json'),
  gifs: join(DATA_DIR, 'gifs.json'),
  site: join(DATA_DIR, 'site.json'),
  readme: join(ROOT, 'README.md'),
};

export type SiteConfig = {
  name: string;
  title: string;
  description: string;
  url: string;
  forumsUrl: string;
  latestMarathon: {
    name: string;
    threadUrl: string;
  };
};

export function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function latestMarathonThreadLabel(marathonName: string) {
  return `${marathonName} Readathon Thread`;
}

export function syncReadmeLinks(site: SiteConfig = readJson(PATHS.site) as SiteConfig) {
  const readme = readFileSync(PATHS.readme, 'utf8');
  const threadLabel = latestMarathonThreadLabel(site.latestMarathon.name);
  const linksSection = `## Come hang out

- [${threadLabel}](${site.latestMarathon.threadUrl})
- [WaniKani Community Forums](${site.forumsUrl})
`;

  const linksSectionPattern = /## Come hang out\n\n(?:- .+\n)+/;
  if (!linksSectionPattern.test(readme)) {
    throw new Error('Could not find ## Come hang out section in README.md to update');
  }

  writeFileSync(PATHS.readme, readme.replace(linksSectionPattern, linksSection), 'utf8');
  return {
    threadLabel,
    threadUrl: site.latestMarathon.threadUrl,
    forumsUrl: site.forumsUrl,
  };
}

export function updateLatestMarathon(marathonName: string, threadUrl: string) {
  const site = readJson(PATHS.site) as SiteConfig;
  site.latestMarathon = {
    name: marathonName,
    threadUrl,
  };
  writeJson(PATHS.site, site);
  syncReadmeLinks(site);
  return site.latestMarathon;
}

export function formatToday(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sortMarathonNames(marathonNames: string[]) {
  const seasonOrder: Record<string, number> = {
    Winter: 4,
    Fall: 3,
    Autumn: 3,
    Summer: 2,
    Spring: 1,
  };
  return [...marathonNames].sort((leftName, rightName) => {
    const chronologicalValue = (marathonName: string) => {
      const [season, year] = marathonName.split(' ');
      return Number(year) * 10 + (seasonOrder[season] || 0);
    };
    return chronologicalValue(leftName) - chronologicalValue(rightName);
  });
}

export function buildUsersList(
  allStats: Record<string, Array<{ user: string }>>,
  preferredUsernameCasing: string[] = [],
) {
  const canonicalUsernameByLowercase = new Map<string, string>();

  for (const username of preferredUsernameCasing) {
    canonicalUsernameByLowercase.set(username.toLowerCase(), username);
  }

  for (const participants of Object.values(allStats)) {
    for (const participant of participants) {
      const lowercaseUsername = participant.user.toLowerCase();
      if (!canonicalUsernameByLowercase.has(lowercaseUsername)) {
        canonicalUsernameByLowercase.set(lowercaseUsername, participant.user);
      }
    }
  }

  return [...canonicalUsernameByLowercase.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' }),
  );
}

export function syncGifList(allStats: Record<string, unknown>) {
  const publicGifFilenames = new Set(
    existsSync(PUBLIC_DIR)
      ? readdirSync(PUBLIC_DIR).filter((filename) => filename.toLowerCase().endsWith('.gif'))
      : [],
  );

  const availableGifFilenames: string[] = [];
  const missingGifs: Array<{ marathon: string; gif: string }> = [];

  for (const marathonName of sortMarathonNames(Object.keys(allStats))) {
    const gifFilename = marathonNameToGifFilename(marathonName);
    if (publicGifFilenames.has(gifFilename)) {
      availableGifFilenames.push(gifFilename);
    } else {
      missingGifs.push({ marathon: marathonName, gif: gifFilename });
    }
  }

  return { gifs: availableGifFilenames, missing: missingGifs };
}

export function rewriteDerivedData({
  bumpLastUpdated = false,
  today = formatToday(),
}: {
  bumpLastUpdated?: boolean;
  today?: string;
} = {}) {
  const allStats = readJson(PATHS.allStats) as Record<string, Array<{ user: string }>>;
  const previousUsers = existsSync(PATHS.users) ? (readJson(PATHS.users) as string[]) : [];
  const users = buildUsersList(allStats, previousUsers);
  const { gifs, missing } = syncGifList(allStats);

  writeJson(PATHS.users, users);
  writeJson(PATHS.gifs, gifs);
  const readmeLinks = syncReadmeLinks();

  if (bumpLastUpdated) {
    const meta = existsSync(PATHS.meta) ? (readJson(PATHS.meta) as Record<string, string>) : {};
    meta.lastUpdated = today;
    writeJson(PATHS.meta, meta);
  }

  return { users, gifs, missing, marathonCount: Object.keys(allStats).length, readmeLinks };
}

export function upsertMarathon(
  marathonName: string,
  participants: unknown[],
  { dryRun = false, bumpLastUpdated = true }: { dryRun?: boolean; bumpLastUpdated?: boolean } = {},
) {
  const allStats = readJson(PATHS.allStats) as Record<string, unknown>;
  const statsWithUpsertedMarathon = { ...allStats, [marathonName]: participants };
  const chronologicallyOrderedStats: Record<string, unknown> = {};

  for (const name of sortMarathonNames(Object.keys(statsWithUpsertedMarathon))) {
    chronologicallyOrderedStats[name] = statsWithUpsertedMarathon[name];
  }

  if (!dryRun) {
    writeJson(PATHS.allStats, chronologicallyOrderedStats);
    return rewriteDerivedData({ bumpLastUpdated });
  }

  const previousUsers = existsSync(PATHS.users) ? (readJson(PATHS.users) as string[]) : [];
  return {
    users: buildUsersList(
      chronologicallyOrderedStats as Record<string, Array<{ user: string }>>,
      previousUsers,
    ),
    ...syncGifList(chronologicallyOrderedStats),
    marathonCount: Object.keys(chronologicallyOrderedStats).length,
    dryRunStats: chronologicallyOrderedStats,
  };
}
