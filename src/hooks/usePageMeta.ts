import { useEffect } from 'react';
import { SITE } from '../constants';

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
    const title = username ? `${username} · ${SITE.name}` : SITE.name;
    document.title = titleSuffix ? `${title} — ${titleSuffix}` : title;

    const description = username
      ? `${username}'s WaniKani readathon statistics and achievement card.`
      : SITE.description;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
  }, [username, titleSuffix]);
}
