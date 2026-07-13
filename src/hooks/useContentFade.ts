import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react';

export const CONTENT_FADE_MS = 300;

export function useContentFade(active: boolean, durationMs = CONTENT_FADE_MS) {
  const [mounted, setMounted] = useState(active);
  const [visible, setVisible] = useState(active);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return;
    }

    setVisible(false);
    hideTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = null;
      setMounted(false);
    }, durationMs);
  }, [active, durationMs]);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    },
    [],
  );

  const onTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== 'opacity' || active) return;
      setMounted(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    },
    [active],
  );

  const fadeClass = visible ? 'content-fade-visible' : 'content-fade-hidden';

  return { mounted, fadeClass, onTransitionEnd };
}
