import { useEffect, useRef } from 'react';
import { useStore } from './StoreContext';
import { findCanonicalUsername } from '../utils/username';
import { getUserFromUrl, setUserInUrl } from '../utils/urlUser';

export function useUrlUserSync(allUsers: string[]) {
  const { currentQuery, setCurrentQuery } = useStore();
  const hasLoadedFromUrl = useRef(false);
  const skipUrlUpdate = useRef(false);

  useEffect(() => {
    const urlUsername = getUserFromUrl();
    if (urlUsername) {
      skipUrlUpdate.current = true;
      const canonical = findCanonicalUsername(allUsers, urlUsername);
      setCurrentQuery(canonical ?? urlUsername.trim());
    }
    hasLoadedFromUrl.current = true;
  }, [setCurrentQuery, allUsers]);

  useEffect(() => {
    if (!hasLoadedFromUrl.current) return;
    if (skipUrlUpdate.current) {
      skipUrlUpdate.current = false;
      return;
    }

    const canonicalUser = findCanonicalUsername(allUsers, currentQuery);
    const urlUsername = getUserFromUrl();

    if (canonicalUser) {
      if (urlUsername !== canonicalUser) setUserInUrl(canonicalUser);
      return;
    }

    if (!currentQuery && urlUsername) {
      setUserInUrl('');
      return;
    }

    if (currentQuery && urlUsername) {
      setUserInUrl('');
    }
  }, [currentQuery, allUsers]);

  useEffect(() => {
    const handlePopState = () => {
      skipUrlUpdate.current = true;
      const urlUsername = getUserFromUrl();
      const canonical = findCanonicalUsername(allUsers, urlUsername);
      setCurrentQuery(canonical ?? urlUsername.trim());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentQuery, allUsers]);
}
