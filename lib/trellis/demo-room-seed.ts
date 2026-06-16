/** Demo collections + records seeded when a tenant has no collections yet. */

export type DemoCollectionSeed = {
  title: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  sortOrder: number;
  defaultView?: 'list' | 'table' | 'card-grid';
  records: Array<{ title: string; body?: string }>;
};

export const DEMO_COLLECTION_SEEDS: DemoCollectionSeed[] = [
  {
    title: 'Posts',
    slug: 'posts',
    icon: 'message-square',
    color: '#0f62fe',
    description: 'Short updates — twitter-style feed in Posts',
    sortOrder: 0,
    defaultView: 'list',
    records: [
      {
        title: 'Graph-native playground',
        body: 'Every projection is a lens on the same Trellis graph. Collections, kanban, calendar — one kernel.',
      },
      {
        title: 'Presence shipped',
        body: 'Cursors, avatars, and live cell text on kanban + table. Open two tabs and say hi.',
      },
      {
        title: 'More gizmos incoming',
        body: 'Group chat, fractal vantages, and richer social surfaces are landing weekly. Edit anything. It is a public sandbox.',
      },
    ],
  },
  {
    title: 'Ideas',
    slug: 'ideas',
    icon: 'lightbulb',
    color: '#ff832b',
    description: 'Rough concepts worth revisiting',
    sortOrder: 2,
    records: [
      {
        title: 'Fractal shell contract',
        body: 'One kernel, many vantages — representation vs version.',
      },
      {
        title: 'Collections before fractals',
        body: 'Ship the record type users will actually manage.',
      },
    ],
  },
  {
    title: 'Reading list',
    slug: 'reading-list',
    icon: 'book-open',
    color: '#42be65',
    description: 'Articles and papers to read',
    sortOrder: 3,
    records: [
      {
        title: 'Local-first software',
        body: 'Martin Kleppmann — sync without owning user state.',
      },
    ],
  },
  {
    title: 'Ship log',
    slug: 'ship-log',
    icon: 'rocket',
    color: '#198038',
    description: 'Milestones and demo wedges shipped',
    sortOrder: 4,
    records: [
      {
        title: 'Realtime presence overlay',
        body: 'Cursors, avatars, room share, and collaborative cell text.',
      },
    ],
  },
];
