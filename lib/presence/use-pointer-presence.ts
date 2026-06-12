'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OFFSCREEN } from '@/lib/presence/types';

const THROTTLE_MS = 33;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function usePointerPresence(
  pushPresence: (partial: { x: number; y: number }) => void,
) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [surfaceEl, setSurfaceEl] = useState<HTMLDivElement | null>(null);
  const [selfCursor, setSelfCursor] = useState<{ x: number; y: number } | null>(null);
  const lastSentRef = useRef(0);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushRef = useRef(pushPresence);
  pushRef.current = pushPresence;

  const attachSurface = useCallback((node: HTMLDivElement | null) => {
    surfaceRef.current = node;
    setSurfaceEl(node);
  }, []);

  useEffect(() => {
    const surface = surfaceEl;
    if (!surface) return;

    const send = (x: number, y: number) => {
      lastSentRef.current = Date.now();
      pushRef.current({ x, y });
    };

    const schedule = (x: number, y: number) => {
      const elapsed = Date.now() - lastSentRef.current;
      if (elapsed >= THROTTLE_MS) {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
        send(x, y);
        return;
      }
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        send(x, y);
      }, THROTTLE_MS - elapsed);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = surface.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = clamp01((event.clientX - rect.left) / rect.width);
      const y = clamp01((event.clientY - rect.top) / rect.height);
      setSelfCursor({ x, y });
      schedule(x, y);
    };

    const hideCursor = () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      setSelfCursor(null);
      send(OFFSCREEN, OFFSCREEN);
    };

    const onPointerOut = (event: PointerEvent) => {
      const related = event.relatedTarget as Node | null;
      if (related && surface.contains(related)) return;
      hideCursor();
    };

    surface.addEventListener('pointermove', onPointerMove, { passive: true });
    surface.addEventListener('pointerout', onPointerOut);
    return () => {
      surface.removeEventListener('pointermove', onPointerMove);
      surface.removeEventListener('pointerout', onPointerOut);
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, [surfaceEl]);

  return { attachSurface, selfCursor };
}
