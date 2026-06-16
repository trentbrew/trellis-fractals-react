'use client';

import { useEffect } from 'react';
import type { BoardPresence } from '@/lib/presence/types';

/** Broadcast tab hidden/visible state into session presence (header avatars). */
export function useTabVisibilityPresence(
  pushPresence: (partial: Partial<BoardPresence>) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const sync = () => {
      pushPresence({ away: document.hidden });
    };

    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [pushPresence, enabled]);
}
