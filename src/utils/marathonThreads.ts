/** Community topic URLs for each marathon (thread root, not a user post). */
const MARATHON_THREAD_URLS: Record<string, string> = {
  'Summer 2024': 'https://community.wanikani.com/t/66274',
  'Fall 2024': 'https://community.wanikani.com/t/67223',
  'Winter 2024': 'https://community.wanikani.com/t/68650',
  'Spring 2025': 'https://community.wanikani.com/t/69562',
  'Summer 2025': 'https://community.wanikani.com/t/70381',
  'Autumn 2025': 'https://community.wanikani.com/t/71481',
  'Winter 2025': 'https://community.wanikani.com/t/72793',
  'Spring 2026': 'https://community.wanikani.com/t/73789',
  'Summer 2026': 'https://community.wanikani.com/t/74572',
};

export function getMarathonThreadUrl(marathonName: string): string | null {
  return MARATHON_THREAD_URLS[marathonName] ?? null;
}
