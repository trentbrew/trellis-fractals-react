'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { PresencePeer } from 'trellis/realtime';
import type { BoardPresence } from '@/lib/presence/types';
import { diffRemotePeers, snapshotRemotePeers } from '@/lib/presence/peer-diff';

function presencePeerToast(message: string, color: string) {
  toast(message, {
    duration: 3500,
    icon: (
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full ring-1 ring-border/60"
        style={{ backgroundColor: color }}
      />
    ),
  });
}

/**
 * Toast when remote peers join or leave the current page-scoped presence room.
 * Skips the initial snapshot and resets when the room scope changes.
 */
export function usePresencePeerToasts(
  others: PresencePeer<BoardPresence>[],
  roomKey: string,
  enabled = true,
) {
  const previousPeersRef = useRef<Map<string, { id: string; name: string; color: string }> | null>(
    null,
  );
  const roomKeyRef = useRef(roomKey);

  useEffect(() => {
    if (roomKeyRef.current !== roomKey) {
      roomKeyRef.current = roomKey;
      previousPeersRef.current = null;
    }
  }, [roomKey]);

  useEffect(() => {
    if (!enabled) {
      previousPeersRef.current = null;
      return;
    }

    const current = snapshotRemotePeers(others);
    const { joined, left, baseline } = diffRemotePeers(previousPeersRef.current, current);
    previousPeersRef.current = current;

    if (baseline) return;

    for (const peer of joined) {
      presencePeerToast(`${peer.name} joined`, peer.color);
    }
    for (const peer of left) {
      presencePeerToast(`${peer.name} left`, peer.color);
    }
  }, [others, enabled]);
}
