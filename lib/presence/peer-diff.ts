import type { PresencePeer } from 'trellis/realtime';
import type { BoardPresence } from '@/lib/presence/types';

export type PeerSnapshot = { id: string; name: string; color: string };

export function snapshotRemotePeers(
  others: PresencePeer<BoardPresence>[],
): Map<string, PeerSnapshot> {
  return new Map(
    others.map((peer) => [
      peer.id,
      { id: peer.id, name: peer.state.name, color: peer.state.color },
    ]),
  );
}

/** Compare remote peer snapshots; `null` previous means establish baseline only. */
export function diffRemotePeers(
  previous: Map<string, PeerSnapshot> | null,
  current: Map<string, PeerSnapshot>,
): { joined: PeerSnapshot[]; left: PeerSnapshot[]; baseline: boolean } {
  if (previous === null) {
    return { joined: [], left: [], baseline: true };
  }

  const joined: PeerSnapshot[] = [];
  const left: PeerSnapshot[] = [];

  for (const peer of current.values()) {
    if (!previous.has(peer.id)) joined.push(peer);
  }
  for (const peer of previous.values()) {
    if (!current.has(peer.id)) left.push(peer);
  }

  return { joined, left, baseline: false };
}
