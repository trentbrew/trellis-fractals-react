import type { PresencePeer, PresenceState } from 'trellis/realtime';

/** Collapse duplicate peer ids — prefer the `self` entry when both exist. */
export function dedupePresencePeers<P extends PresenceState>(
  peers: PresencePeer<P>[],
): PresencePeer<P>[] {
  const byId = new Map<string, PresencePeer<P>>();
  for (const peer of peers) {
    const existing = byId.get(peer.id);
    if (!existing || (peer.self && !existing.self)) {
      byId.set(peer.id, peer);
    }
  }

  let self: PresencePeer<P> | undefined;
  const others: PresencePeer<P>[] = [];
  for (const peer of byId.values()) {
    if (peer.self) self = peer;
    else others.push(peer);
  }
  others.sort((a, b) => a.id.localeCompare(b.id));
  return self ? [self, ...others] : others;
}
