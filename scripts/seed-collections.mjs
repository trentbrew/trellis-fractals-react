#!/usr/bin/env node
/**
 * Seed demo collections + records (idempotent). Targets trellis sidecar on :8230.
 *
 *   node scripts/seed-collections.mjs
 *   TRELLIS_URL=http://localhost:8230 node scripts/seed-collections.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { authHeaders, trellisEnv } from './trellis-config.mjs';
import {
  IDEAS_RECORD_FIELDS,
  IDEAS_RECORD_ONTOLOGY_ID,
  IDEAS_SEED_RECORDS,
} from '../lib/trellis/demo-ideas-seed.mjs';

const { base: TRELLIS_URL, apiKey } = trellisEnv();
const META_PREFIX = 'collectionMeta:';
const RECORD_PREFIX = 'collectionRecord:';

const SEED_COLLECTIONS = [
  {
    id: `${META_PREFIX}posts`,
    title: 'Posts',
    slug: 'posts',
    icon: 'message-square',
    color: '#0f62fe',
    description: 'Short updates — twitter-style feed in Realtime → Posts',
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
    id: `${META_PREFIX}ideas`,
    title: 'Ideas',
    slug: 'ideas',
    icon: 'lightbulb',
    color: '#0f62fe',
    description: 'Rough concepts and sparks worth revisiting',
    sortOrder: 2,
    records: IDEAS_SEED_RECORDS,
    richSchema: true,
  },
  {
    id: `${META_PREFIX}reading-list`,
    title: 'Reading list',
    slug: 'reading-list',
    icon: 'book-open',
    color: '#8a3ffc',
    description: 'Articles, papers, and threads to read',
    sortOrder: 3,
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
    sortOrder: 4,
    records: [
      {
        title: 'Realtime presence overlay',
        body: 'Cursors, avatars, room share, and collaborative cell text.',
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
  return { ok: res.ok, status: res.status, data };
}

async function apiOrThrow(method, path, body) {
  const result = await api(method, path, body);
  if (!result.ok) {
    throw new Error(`HTTP ${result.status}: ${result.data.message ?? 'request failed'}`);
  }
  return result.data;
}

function writeOntologyOverlay(ontologyId, fields, label) {
  const dbPath = resolve(process.cwd(), '.trellis-db');
  const overlayPath = join(dbPath, 'ontology-overlays.json');
  let overlay = {};
  if (existsSync(overlayPath)) {
    try {
      overlay = JSON.parse(readFileSync(overlayPath, 'utf8'));
    } catch {
      overlay = {};
    }
  }
  overlay[ontologyId] = {
    '@id': ontologyId,
    label,
    fields,
  };
  mkdirSync(dbPath, { recursive: true });
  writeFileSync(overlayPath, `${JSON.stringify(overlay, null, 2)}\n`);
}

function recordPayload(collectionId, row, sortOrder) {
  const { relatedRecordTitle: _relatedRecordTitle, ...attributes } = row;
  return {
    collectionId,
    sortOrder,
    laneId: 'main',
    ...attributes,
  };
}

function rowNeedsEnrichment(existing, row) {
  for (const [key, value] of Object.entries(row)) {
    if (key === 'relatedRecordTitle' || value === undefined) continue;
    const current = existing[key];
    if (current === undefined || current === null || current === '') return true;
  }
  return false;
}

async function ensureIdeasSchema() {
  const ontologyBody = {
    '@id': IDEAS_RECORD_ONTOLOGY_ID,
    '@type': 'trellis:Schema',
    version: '1.0.0',
    tier: 'user',
    subClassOf: 'core:Record',
    label: 'Ideas records',
    fields: IDEAS_RECORD_FIELDS,
  };

  const post = await api('POST', '/ontologies', ontologyBody);
  if (!post.ok) {
    const patch = await api(
      'PATCH',
      `/ontologies/${encodeURIComponent(IDEAS_RECORD_ONTOLOGY_ID)}`,
      { fields: IDEAS_RECORD_FIELDS },
    );
    if (!patch.ok) {
      throw new Error(
        `Failed to register Ideas record schema: ${patch.data.message ?? patch.status}`,
      );
    }
  }

  writeOntologyOverlay(IDEAS_RECORD_ONTOLOGY_ID, IDEAS_RECORD_FIELDS, 'Ideas records');
}

const metaList = await apiOrThrow('GET', '/entities?type=CollectionMeta&limit=500');
const slugs = new Set((metaList.data ?? []).map((e) => String(e.slug ?? '')));

let metaCreated = 0;
let recordsCreated = 0;
let recordsUpdated = 0;

await ensureIdeasSchema();

for (const collection of SEED_COLLECTIONS) {
  if (!slugs.has(collection.slug)) {
    await apiOrThrow('POST', '/entities', {
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

  const recordList = await apiOrThrow('GET', '/entities?type=CollectionRecord&limit=500');
  const recordsForCollection = (recordList.data ?? []).filter(
    (entry) => entry.collectionId === collection.id,
  );
  const byTitle = new Map(
    recordsForCollection.map((entry) => [String(entry.title ?? ''), entry]),
  );

  for (let i = 0; i < collection.records.length; i++) {
    const row = collection.records[i];
    const existing = byTitle.get(row.title);
    const attributes = recordPayload(collection.id, row, i);

    if (!existing) {
      const created = await apiOrThrow('POST', '/entities', {
        id: `${RECORD_PREFIX}${randomUUID()}`,
        type: 'CollectionRecord',
        attributes,
      });
      byTitle.set(row.title, created.data ?? created);
      recordsCreated++;
      continue;
    }

    if (rowNeedsEnrichment(existing, row)) {
      await apiOrThrow('PATCH', `/entities/${existing.id}`, attributes);
      recordsUpdated++;
    }
  }

  if (collection.richSchema) {
    const refreshed = await apiOrThrow('GET', '/entities?type=CollectionRecord&limit=500');
    const ideasRows = (refreshed.data ?? []).filter(
      (entry) => entry.collectionId === collection.id,
    );
    const rowByTitle = new Map(
      ideasRows.map((entry) => [String(entry.title ?? ''), entry]),
    );

    for (const row of collection.records) {
      if (!row.relatedRecordTitle) continue;
      const source = rowByTitle.get(row.title);
      const target = rowByTitle.get(row.relatedRecordTitle);
      if (!source?.id || !target?.id || source.relatedRecord === target.id) continue;
      await apiOrThrow('PATCH', `/entities/${source.id}`, {
        relatedRecord: target.id,
      });
      recordsUpdated++;
    }
  }
}

console.log(
  metaCreated || recordsCreated || recordsUpdated
    ? `✓ Seeded ${metaCreated} collection(s), ${recordsCreated} record(s), updated ${recordsUpdated} record(s)`
    : '✓ Collection seed data already present',
);
