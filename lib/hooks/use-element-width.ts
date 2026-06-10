'use client';

import { useEffect, useRef, useState } from 'react';

/** Tracks an element's content width via ResizeObserver — drives calendar/gantt grid metrics. */
export function useElementWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth);

    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
