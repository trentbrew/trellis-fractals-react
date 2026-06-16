'use client';

import { useEffect, useRef, useState } from 'react';
import { resolvePointerPresence } from '@/lib/presence/coordinate-space';
import { OFFSCREEN } from '@/lib/presence/types';

const THROTTLE_MS = 33;

/** Streams viewport clientX/clientY — rendered verbatim on peers. */
export function usePointerPresence(
  pushPresence: (partial: { x: number; y: number }) => void,
) {
  const [selfCursor, setSelfCursor] = useState<{ x: number; y: number } | null>(null);
  const lastSentRef = useRef(0);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushRef = useRef(pushPresence);
  pushRef.current = pushPresence;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const send = (coords: { x: number; y: number }) => {
      lastSentRef.current = Date.now();
      pushRef.current(coords);
    };

    const schedule = (coords: { x: number; y: number }) => {
      const elapsed = Date.now() - lastSentRef.current;
      if (elapsed >= THROTTLE_MS) {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
        send(coords);
        return;
      }
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        send(coords);
      }, THROTTLE_MS - elapsed);
    };

    const onPointerMove = (event: PointerEvent) => {
      const coords = resolvePointerPresence(event.clientX, event.clientY);
      setSelfCursor(coords);
      schedule(coords);
    };

    const hideCursor = () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      setSelfCursor(null);
      send({ x: OFFSCREEN, y: OFFSCREEN });
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) hideCursor();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', hideCursor);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', hideCursor);
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, []);

  return { selfCursor };
}
