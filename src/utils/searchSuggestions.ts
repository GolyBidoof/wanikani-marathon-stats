import { findCanonicalUsername } from './username';
import { normalizeUsername } from './statsQueries';

export function getSearchSuggestions(allUsers: string[], query: string, limit = 5): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  if (findCanonicalUsername(allUsers, trimmed)) return [];

  const normalized = normalizeUsername(trimmed);
  return allUsers
    .filter((username) => normalizeUsername(username).includes(normalized))
    .slice(0, limit);
}
