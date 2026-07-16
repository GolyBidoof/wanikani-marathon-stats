export function formatLastUpdated(dateString: string, locale = 'en-US'): string {
  const parsed = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateString;

  return parsed.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
