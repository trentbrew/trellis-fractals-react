import { describe, expect, it } from 'vitest';
import { diffRemotePeers, snapshotRemotePeers } from './peer-diff';

describe('diffRemotePeers', () => {
  it('establishes baseline without events on first snapshot', () => {
    const current = new Map([
      ['a', { id: 'a', name: 'Ada', color: '#f00' }],
    ]);
    expect(diffRemotePeers(null, current)).toEqual({
      joined: [],
      left: [],
      baseline: true,
    });
  });

  it('detects join and leave', () => {
    const previous = snapshotRemotePeers([
      {
        id: 'a',
        self: false,
        state: { name: 'Ada', color: '#f00', x: 0, y: 0 },
      },
    ] as never);
    const current = snapshotRemotePeers([
      {
        id: 'b',
        self: false,
        state: { name: 'Bob', color: '#0f0', x: 0, y: 0 },
      },
    ] as never);

    expect(diffRemotePeers(previous, current)).toEqual({
      joined: [{ id: 'b', name: 'Bob', color: '#0f0' }],
      left: [{ id: 'a', name: 'Ada', color: '#f00' }],
      baseline: false,
    });
  });
});
