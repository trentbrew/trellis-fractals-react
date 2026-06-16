'use client';

import { useEffect, useState } from 'react';
import { useBoardPresence } from '@/lib/presence/context';
import { getOrCreatePresenceIdentity, type PresenceIdentity } from '@/lib/presence/identity';

/** SSR-safe identity — resolves after mount from presence context or sessionStorage. */
export function usePresenceIdentity(): PresenceIdentity | null {
  const board = useBoardPresence();
  const [identity, setIdentity] = useState<PresenceIdentity | null>(null);

  useEffect(() => {
    setIdentity(board?.identity ?? getOrCreatePresenceIdentity());
  }, [board?.identity]);

  return identity;
}
