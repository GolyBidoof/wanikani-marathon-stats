import { useEffect } from 'react';
import { buildUserUrl } from '../utils/urlUser';

const SITE_NAME = 'WaniKani 24-hour Readathon Stats';
const DEFAULT_DESCRIPTION =
  'Track your WaniKani readathon stats, customize your achievement card, and explore marathon history.';

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    const meta = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      if (key !== 'content') meta.setAttribute(key, value);
    });
    document.head.appendChild(meta);
    element = meta;
  }
  if (attributes.content) element.content = attributes.content;
}

function ogImagePath(username?: string) {
  const base = import.meta.env.BASE_URL;
  if (!username) return `${base}og/default.png`;
  return `${base}og/${encodeURIComponent(username)}.png`;
}

export function usePageMeta({
  username,
  titleSuffix,
}: {
  username?: string;
  titleSuffix?: string;
}) {
  useEffect(() => {
    const title = username ? `${username} · ${SITE_NAME}` : SITE_NAME;
    document.title = titleSuffix ? `${title} — ${titleSuffix}` : title;

    const description = username
      ? `${username}'s WaniKani readathon statistics and achievement card.`
      : DEFAULT_DESCRIPTION;

    const pageUrl = username ? buildUserUrl(username) : window.location.href;
    const imageUrl = new URL(ogImagePath(username), window.location.origin).toString();

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description,
    });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });
  }, [username, titleSuffix]);
}
