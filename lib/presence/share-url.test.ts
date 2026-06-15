import { describe, expect, it } from 'vitest';
import { buildRoomShareUrl } from './share-url';

describe('buildRoomShareUrl', () => {
  it('sets room on the current path', () => {
    expect(
      buildRoomShareUrl({
        origin: 'https://playground.trellis.computer',
        pathname: '/projections/kanban',
        room: 'design-review',
      }),
    ).toBe('https://playground.trellis.computer/projections/kanban?room=design-review');
  });

  it('strips embed chrome but keeps other params', () => {
    expect(
      buildRoomShareUrl({
        origin: 'https://playground.trellis.computer',
        pathname: '/collections/cards',
        room: 'fractals-blog',
        search: '?embed=1&vantage=8&configure=general',
      }),
    ).toBe(
      'https://playground.trellis.computer/collections/cards?vantage=8&room=fractals-blog',
    );
  });

  it('overrides room when search already names one', () => {
    expect(
      buildRoomShareUrl({
        origin: 'http://localhost:3000',
        pathname: '/projections/kanban',
        room: 'new-room',
        search: '?room=old-room',
      }),
    ).toBe('http://localhost:3000/projections/kanban?room=new-room');
  });
});
