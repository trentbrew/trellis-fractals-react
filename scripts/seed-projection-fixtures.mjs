#!/usr/bin/env node
/**
 * Seed projection fixture entities (idempotent). Targets trellis sidecar on :8230.
 * Structurally diverse, semantically meaningless — stresses every resolver path.
 *
 *   node scripts/seed-projection-fixtures.mjs
 *   TRELLIS_URL=http://localhost:8230 node scripts/seed-projection-fixtures.mjs
 */
import { authHeaders, trellisEnv } from './trellis-config.mjs';

const { base: TRELLIS_URL, apiKey } = trellisEnv();
const FIXTURE_PREFIX = 'fixture:';

const FIXTURES = [
  {
    type: 'Task',
    entities: [
      { id: `${FIXTURE_PREFIX}task:pending-long`, title: 'Pending with a very long title that should wrap or truncate gracefully in the list row', done: false },
      { id: `${FIXTURE_PREFIX}task:completed`, title: 'Completed item', done: true },
      { id: `${FIXTURE_PREFIX}task:pending-short`, title: 'X', done: false },
      { id: `${FIXTURE_PREFIX}task:pending-mid`, title: 'Another pending task', done: false },
      { id: `${FIXTURE_PREFIX}task:done-edge`, title: 'Done edge case', done: true },
    ],
  },
  {
    type: 'Card',
    entities: [
      // Stress fixtures — no image, so they exercise the color-block fallback.
      { id: `${FIXTURE_PREFIX}card:alpha`, title: 'Alpha', body: 'Short body', colorIndex: 0 },
      { id: `${FIXTURE_PREFIX}card:empty-title`, title: '', body: 'Empty title card', colorIndex: 3 },
      { id: `${FIXTURE_PREFIX}card:multiline`, title: 'Multi\nline', body: 'Body with\nline breaks', colorIndex: 7 },
      { id: `${FIXTURE_PREFIX}card:max-color`, title: 'Max color index', body: '', colorIndex: 15 },
      { id: `${FIXTURE_PREFIX}card:long-body`, title: 'Verbose', body: 'Lorem ipsum '.repeat(12), colorIndex: 11 },
      // Rich product fixtures — varied prop types so each vantage discloses more.
      {
        id: `${FIXTURE_PREFIX}card:aero-runner`,
        title: 'Aero Runner',
        body: 'Featherweight trail shoe with responsive foam and a breathable knit upper that drains and dries fast on long runs.',
        colorIndex: 4,
        image: 'https://picsum.photos/seed/aero-runner/800/450',
        brand: 'Vellum',
        category: 'outdoors',
        tags: ['running', 'trail', 'lightweight'],
        price: 138,
        rating: 4.6,
        url: 'https://example.com/products/aero-runner',
      },
      {
        id: `${FIXTURE_PREFIX}card:halcyon`,
        title: 'Halcyon Headphones',
        body: 'Over-ear active noise cancelation with 40-hour battery and a sealed memory-foam cushion.',
        colorIndex: 9,
        image: 'https://picsum.photos/seed/halcyon/800/450',
        brand: 'Northwind',
        category: 'tech',
        tags: ['audio', 'anc', 'wireless'],
        price: 279,
        rating: 4.8,
        url: 'https://example.com/products/halcyon',
      },
      {
        id: `${FIXTURE_PREFIX}card:drift-chair`,
        title: 'Drift Lounge Chair',
        body: 'Bent-ply frame with a wool-blend sling seat.',
        colorIndex: 2,
        image: 'https://picsum.photos/seed/drift-chair/800/450',
        brand: 'Fold',
        category: 'home',
        tags: ['seating', 'midcentury'],
        price: 540,
        rating: 4.4,
        url: 'https://example.com/products/drift-chair',
      },
      {
        id: `${FIXTURE_PREFIX}card:tundra-shell`,
        title: 'Tundra Shell Jacket',
        body: 'Three-layer waterproof shell with pit zips, a helmet-compatible hood, and fully taped seams.',
        colorIndex: 6,
        image: 'https://picsum.photos/seed/tundra-shell/800/450',
        brand: 'Vellum',
        category: 'apparel',
        tags: ['outerwear', 'waterproof', 'shell', 'alpine'],
        price: 320,
        rating: 4.5,
        url: 'https://example.com/products/tundra-shell',
      },
      {
        id: `${FIXTURE_PREFIX}card:vanguard-pack`,
        title: 'Vanguard 28 Backpack',
        body: 'Roll-top daypack in recycled sailcloth.',
        colorIndex: 1,
        image: 'https://picsum.photos/seed/vanguard-pack/800/450',
        brand: 'Northwind',
        category: 'outdoors',
        tags: ['carry', 'commuter'],
        price: 165,
        rating: 4.3,
        url: 'https://example.com/products/vanguard-pack',
      },
      {
        id: `${FIXTURE_PREFIX}card:meridian-kb`,
        title: 'Meridian Keyboard',
        body: 'Low-profile mechanical board with hot-swap switches, a machined aluminum deck, and per-key backlight.',
        colorIndex: 12,
        image: 'https://picsum.photos/seed/meridian-kb/800/450',
        brand: 'Fold',
        category: 'tech',
        tags: ['desk', 'mechanical', 'wireless'],
        price: 199,
        rating: 4.7,
        url: 'https://example.com/products/meridian-kb',
      },
      {
        id: `${FIXTURE_PREFIX}card:ember-kettle`,
        title: 'Ember Pour-Over Kettle',
        body: 'Gooseneck kettle with variable temperature control and a one-degree hold.',
        colorIndex: 8,
        image: 'https://picsum.photos/seed/ember-kettle/800/450',
        brand: 'Hearth',
        category: 'food',
        tags: ['coffee', 'kitchen'],
        price: 145,
        rating: 4.9,
        url: 'https://example.com/products/ember-kettle',
      },
      {
        id: `${FIXTURE_PREFIX}card:solace-watch`,
        title: 'Solace Field Watch',
        body: 'Sapphire crystal, 200m water resistance, and a sandblasted titanium case on a quick-release strap.',
        colorIndex: 14,
        image: 'https://picsum.photos/seed/solace-watch/800/450',
        brand: 'Meridian Co.',
        category: 'apparel',
        tags: ['watch', 'titanium', 'field'],
        price: 425,
        rating: 4.2,
        url: 'https://example.com/products/solace-watch',
      },
    ],
  },
  {
    type: 'KanbanCard',
    entities: [
      { id: `${FIXTURE_PREFIX}kanban:backlog`, title: 'Backlog card', status: 'backlog' },
      { id: `${FIXTURE_PREFIX}kanban:doing`, title: 'In progress', status: 'doing' },
      { id: `${FIXTURE_PREFIX}kanban:done`, title: 'Shipped', status: 'done' },
      { id: `${FIXTURE_PREFIX}kanban:empty`, title: '', status: 'backlog' },
      { id: `${FIXTURE_PREFIX}kanban:blocked`, title: 'Blocked-ish', status: 'doing' },
      { id: `${FIXTURE_PREFIX}kanban:overflow`, title: 'Lane overflow stress', status: 'backlog' },
    ],
  },
  {
    type: 'CalendarEvent',
    entities: [
      {
        id: `${FIXTURE_PREFIX}cal:standup`,
        title: 'Morning standup',
        start: '2026-06-10T09:00:00',
        end: '2026-06-10T09:30:00',
        allDay: false,
        colorIndex: 1,
      },
      {
        id: `${FIXTURE_PREFIX}cal:overlap`,
        title: 'Overlapping meeting',
        start: '2026-06-10T09:15:00',
        end: '2026-06-10T10:00:00',
        allDay: false,
        colorIndex: 2,
      },
      {
        id: `${FIXTURE_PREFIX}cal:allday`,
        title: 'All-day event',
        start: '2026-06-10',
        end: '2026-06-11',
        allDay: true,
        colorIndex: 5,
      },
      {
        id: `${FIXTURE_PREFIX}cal:span`,
        title: 'Multi-day span',
        start: '2026-06-08',
        end: '2026-06-14',
        allDay: true,
        colorIndex: 0,
      },
      {
        id: `${FIXTURE_PREFIX}cal:late`,
        title: 'Late slot',
        start: '2026-06-10T22:00:00',
        end: '2026-06-10T23:30:00',
        allDay: false,
        colorIndex: 9,
      },
    ],
  },
  {
    type: 'DagNode',
    entities: [
      {
        id: `${FIXTURE_PREFIX}dag:root`,
        title: 'Root',
        dependsOn: [],
        colorIndex: 0,
      },
      {
        id: `${FIXTURE_PREFIX}dag:branch-a`,
        title: 'Branch A',
        parentId: `${FIXTURE_PREFIX}dag:root`,
        dependsOn: [],
        colorIndex: 2,
      },
      {
        id: `${FIXTURE_PREFIX}dag:branch-b`,
        title: 'Branch B',
        parentId: `${FIXTURE_PREFIX}dag:root`,
        dependsOn: [],
        colorIndex: 4,
      },
      {
        id: `${FIXTURE_PREFIX}dag:merge`,
        title: 'Merge point',
        dependsOn: [`${FIXTURE_PREFIX}dag:branch-a`, `${FIXTURE_PREFIX}dag:branch-b`],
        colorIndex: 6,
      },
      {
        id: `${FIXTURE_PREFIX}dag:leaf`,
        title: 'Leaf',
        parentId: `${FIXTURE_PREFIX}dag:merge`,
        dependsOn: [`${FIXTURE_PREFIX}dag:branch-a`],
        colorIndex: 9,
      },
    ],
  },
  {
    type: 'GanttTask',
    entities: [
      {
        id: `${FIXTURE_PREFIX}gantt:design`,
        title: 'Design sprint',
        start: '2026-06-01',
        end: '2026-06-05',
        laneId: 'design',
        colorIndex: 2,
      },
      {
        id: `${FIXTURE_PREFIX}gantt:eng-overlap`,
        title: 'Overlap engineering',
        start: '2026-06-04',
        end: '2026-06-10',
        laneId: 'engineering',
        colorIndex: 4,
      },
      {
        id: `${FIXTURE_PREFIX}gantt:ops`,
        title: 'Ops deploy',
        start: '2026-06-09',
        end: '2026-06-12',
        laneId: 'ops',
        colorIndex: 6,
      },
      {
        id: `${FIXTURE_PREFIX}gantt:design-parallel`,
        title: 'Parallel design',
        start: '2026-06-03',
        end: '2026-06-07',
        laneId: 'design',
        colorIndex: 1,
      },
      {
        id: `${FIXTURE_PREFIX}gantt:eng-short`,
        title: 'Short bar',
        start: '2026-06-11',
        end: '2026-06-11',
        laneId: 'engineering',
        colorIndex: 8,
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

let created = 0;
let skipped = 0;

for (const group of FIXTURES) {
  const list = await api('GET', `/entities?type=${group.type}&limit=500`);
  const existingKeys = new Set(
    (list.data ?? []).map((e) => String(e.fixtureKey ?? e.attributes?.fixtureKey ?? '')),
  );

  for (const entity of group.entities) {
    const fixtureKey = entity.id;
    if (existingKeys.has(fixtureKey)) {
      skipped++;
      continue;
    }
    const { id: _id, ...attributes } = entity;
    await api('POST', '/entities', {
      type: group.type,
      attributes: { ...attributes, fixtureKey },
    });
    created++;
    existingKeys.add(fixtureKey);
  }
}

console.log(
  created
    ? `✓ Seeded ${created} projection fixture(s)${skipped ? `, ${skipped} already present` : ''}`
    : `✓ Projection fixtures already present (${skipped} checked)`,
);
