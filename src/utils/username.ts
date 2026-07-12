import { normalizeUsername } from './statsQueries';

export function findCanonicalUsername(allUsers: string[], query: string): string | undefined {
  if (!query) return undefined;
  const normalized = normalizeUsername(query);
  return allUsers.find((user) => normalizeUsername(user) === normalized);
}
