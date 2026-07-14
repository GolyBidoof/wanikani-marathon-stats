import { useEffect } from 'react';

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

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
  }, [username, titleSuffix]);
}
