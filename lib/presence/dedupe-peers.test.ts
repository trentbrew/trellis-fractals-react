import { describe, expect, it } from 'vitest';
import type { PresencePeer } from 'trellis/realtime';
import { dedupePresencePeers } from './dedupe-peers';

const peer = (
  id: string,
  self: boolean,
): PresencePeer<{ name: string }> => ({
  id,
  self,
  lastSeen: 0,
  state: { name: id },
});

describe('dedupePresencePeers', () => {
  it('returns unique peers unchanged', () => {
    const peers = [peer('self', true), peer('b', false), peer('a', false)];
    expect(dedupePresencePeers(peers).map((p) => p.id)).toEqual(['self', 'a', 'b']);
  });

  it('collapses duplicate ids and keeps self', () => {
    const id = '86666977-97a5-44f7-b621-fc999cb72a38';
    const peers = [peer(id, true), peer(id, false), peer('other', false)];
    const deduped = dedupePresencePeers(peers);
    expect(deduped.filter((p) => p.id === id)).toHaveLength(1);
    expect(deduped[0]).toMatchObject({ id, self: true });
  });
});
