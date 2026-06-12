#!/usr/bin/env node
/**
 * Seed demo collections + records (idempotent). Targets trellis sidecar on :8230.
 *
 *   node scripts/seed-collections.mjs
 *   TRELLIS_URL=http://localhost:8230 node scripts/seed-collections.mjs
 */
import { randomUUID } from 'node:crypto';
import { authHeaders, trellisEnv } from './trellis-config.mjs';

const { base: TRELLIS_URL, apiKey } = trellisEnv();
const META_PREFIX = 'collectionMeta:';
const RECORD_PREFIX = 'collectionRecord:';

const SEED_COLLECTIONS = [
  {
    id: `${META_PREFIX}ideas`,
    title: 'Ideas',
    slug: 'ideas',
    icon: 'lightbulb',
    color: '#0f62fe',
    description: 'Rough concepts and sparks worth revisiting',
    sortOrder: 0,
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
    id: `${META_PREFIX}reading-list`,
    title: 'Reading list',
    slug: 'reading-list',
    icon: 'book-open',
    color: '#8a3ffc',
    description: 'Articles, papers, and threads to read',
    sortOrder: 1,
    records: [
      {
        title: 'Local-first software',
        body: 'Martin Kleppmann — sync without owning user state.',
      },
    ],
  },
  {
    id: `${META_PREFIX}ship-log`,
    title: 'Ship log',
    slug: 'ship-log',
    icon: 'rocket',
    color: '#198038',
    description: 'Milestones and demo wedges shipped',
    sortOrder: 2,
    records: [
      {
        title: 'Typed SDK explorer',
        body: 'Graph nav + chat on entitiesStore + mutations.',
      },
    ],
  },
];

async function api(method, path, body) {
  const res = await fetch(`${TRELLIS_URL}${path}`, {
    method,
    headers: authHeaders(apiKey),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.message ?? res.statusText}`);
  return data;
}

const metaList = await api('GET', '/entities?type=CollectionMeta&limit=500');
const slugs = new Set((metaList.data ?? []).map((e) => String(e.slug ?? '')));

let metaCreated = 0;
let recordsCreated = 0;

for (const collection of SEED_COLLECTIONS) {
  if (!slugs.has(collection.slug)) {
    await api('POST', '/entities', {
      id: collection.id,
      type: 'CollectionMeta',
      attributes: {
        title: collection.title,
        slug: collection.slug,
        icon: collection.icon,
        color: collection.color,
        description: collection.description,
        sortOrder: collection.sortOrder,
      },
    });
    metaCreated++;
    slugs.add(collection.slug);
  }

  const recordList = await api('GET', '/entities?type=CollectionRecord&limit=500');
  const titlesForCollection = new Set(
    (recordList.data ?? [])
      .filter((e) => e.collectionId === collection.id)
      .map((e) => String(e.title ?? '')),
  );

  for (let i = 0; i < collection.records.length; i++) {
    const row = collection.records[i];
    if (titlesForCollection.has(row.title)) continue;
    await api('POST', '/entities', {
      id: `${RECORD_PREFIX}${randomUUID()}`,
      type: 'CollectionRecord',
      attributes: {
        collectionId: collection.id,
        title: row.title,
        body: row.body,
        sortOrder: i,
        laneId: 'main',
      },
    });
    recordsCreated++;
  }
}

console.log(
  metaCreated || recordsCreated
    ? `✓ Seeded ${metaCreated} collection(s), ${recordsCreated} record(s)`
    : '✓ Collection seed data already present',
);
