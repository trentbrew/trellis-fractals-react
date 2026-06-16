import type { TrellisDb } from 'trellis/client/sdk';
import {
  CollectionMetaType,
  CollectionRecordType,
} from '@/lib/schemas/collection';
import { KanbanCard } from '@/lib/schemas/kanban-card';
import { DEMO_COLLECTION_SEEDS } from '@/lib/trellis/demo-room-seed';
import { bootstrapExplorerSchemas } from '@/lib/trellis/bootstrap-schemas';

const STARTER_CARDS = [
  { title: 'Your first card', status: 'backlog' as const },
  { title: 'Drag me to Doing', status: 'backlog' as const },
  { title: 'Edit this title inline', status: 'doing' as const },
];

async function seedKanbanIfEmpty(client: TrellisDb): Promise<void> {
  await client.registerType(KanbanCard);
  const list = await client.list('KanbanCard', { limit: 1 });
  if ((list.total ?? 0) > 0) return;

  for (const card of STARTER_CARDS) {
    await client.create('KanbanCard', card);
  }
}

let seedInFlight: Promise<void> | null = null;

async function seedPlaygroundDemo(client: TrellisDb): Promise<void> {
  await bootstrapExplorerSchemas(client);

  const metaList = await client.list('CollectionMeta', { limit: 500 });
  const existingSlugs = new Set(
    (metaList.data ?? []).map((row) => row.slug as string),
  );

  const seedsToCreate = DEMO_COLLECTION_SEEDS.filter(
    (collection) => !existingSlugs.has(collection.slug),
  );

  if (seedsToCreate.length === 0) {
    await seedKanbanIfEmpty(client);
    return;
  }

  for (const collection of seedsToCreate) {
    const collectionId = await client.create('CollectionMeta', {
      title: collection.title,
      slug: collection.slug,
      icon: collection.icon,
      color: collection.color,
      description: collection.description,
      sortOrder: collection.sortOrder,
      defaultView: collection.defaultView,
    });

    for (let i = 0; i < collection.records.length; i++) {
      const row = collection.records[i];
      await client.create('CollectionRecord', {
        collectionId,
        title: row.title,
        body: row.body,
        sortOrder: i,
        laneId: 'main',
      });
    }
  }

  await seedKanbanIfEmpty(client);
}

/** Seed demo collections when this tenant has none (idempotent). */
export function seedPlaygroundDemoIfEmpty(client: TrellisDb): Promise<void> {
  if (!seedInFlight) {
    seedInFlight = seedPlaygroundDemo(client).finally(() => {
      seedInFlight = null;
    });
  }
  return seedInFlight;
}

/** @deprecated Use seedPlaygroundDemoIfEmpty */
export async function seedSessionKanbanIfEmpty(client: TrellisDb): Promise<void> {
  await seedKanbanIfEmpty(client);
}
