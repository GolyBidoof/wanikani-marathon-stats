import {
  useLayoutEffect,
  useCallback,
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
} from 'react';
import { CONTENT_FADE_MS } from './useContentFade';

export function useKeyedFade(
  key: string,
  durationMs = CONTENT_FADE_MS,
  shouldShow: (key: string) => boolean = () => true,
) {
  const [displayKey, setDisplayKey] = useState(key);
  const [visible, setVisible] = useState(shouldShow(key));
  const pendingKeyRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitPendingKey = useCallback(() => {
    if (!pendingKeyRef.current) return;

    const nextKey = pendingKeyRef.current;
    pendingKeyRef.current = null;
    setDisplayKey(nextKey);

    if (shouldShow(nextKey)) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [shouldShow]);

  useLayoutEffect(() => {
    if (key === displayKey) return;

    pendingKeyRef.current = key;
    setVisible(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      commitPendingKey();
    }, durationMs);
  }, [key, displayKey, durationMs, commitPendingKey]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const onTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== 'opacity' || visible || !pendingKeyRef.current) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      commitPendingKey();
    },
    [visible, commitPendingKey],
  );

  const fadeClass = visible ? 'content-fade-visible' : 'content-fade-hidden';

  return { displayKey, fadeClass, onTransitionEnd, isVisible: visible };
}
