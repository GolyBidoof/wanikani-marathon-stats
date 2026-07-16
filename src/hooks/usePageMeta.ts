import { useEffect } from 'react';
import i18n from '../i18n';
import { useStore } from './StoreContext';

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
  const appLanguage = useStore((state) => state.appLanguage);

  useEffect(() => {
    const title = username
      ? i18n.t('meta.userTitle', { username, siteName: i18n.t('meta.siteName') })
      : i18n.t('meta.siteTitle');
    document.title = titleSuffix
      ? i18n.t('meta.suffixedTitle', { title, suffix: titleSuffix })
      : title;

    const description = username
      ? i18n.t('meta.userDescription', { username })
      : i18n.t('meta.siteDescription');

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
  }, [appLanguage, username, titleSuffix]);
}
