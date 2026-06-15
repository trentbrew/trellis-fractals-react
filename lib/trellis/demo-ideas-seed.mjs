/** Shared Ideas collection schema + demo records for seed scripts and e2e resets. */

export const IDEAS_RECORD_ONTOLOGY_ID =
  'https://trellis.dev/ns/demo/v1/collections/ideas/Record';

export const IDEAS_RECORD_FIELDS = [
  { name: 'title', valueType: 'title', required: true },
  { name: 'body', valueType: 'rich_text' },
  {
    name: 'priority',
    valueType: 'select',
    options: ['Low', 'Medium', 'High'],
  },
  { name: 'dueDate', valueType: 'date' },
  { name: 'effort', valueType: 'number' },
  { name: 'published', valueType: 'boolean' },
  { name: 'specUrl', valueType: 'url' },
  { name: 'relatedRecord', valueType: 'reference' },
  { name: 'collectionId', valueType: 'rich_text', required: true },
  { name: 'sortOrder', valueType: 'number' },
  { name: 'laneId', valueType: 'rich_text' },
];

export const IDEAS_SEED_RECORDS = [
  {
    title: 'Fractal shell contract',
    body: 'One kernel, many vantages — representation vs version.',
    priority: 'High',
    dueDate: '2026-06-30',
    effort: 8,
    published: true,
    specUrl: 'https://trellis.computer/fractals',
    relatedRecordTitle: 'Collections before fractals',
  },
  {
    title: 'Collections before fractals',
    body: 'Ship the record type users will actually manage.',
    priority: 'Medium',
    dueDate: '2026-07-15',
    effort: 5,
    published: false,
    specUrl: 'https://trellis.computer/collections',
    relatedRecordTitle: 'Fractal shell contract',
  },
];
