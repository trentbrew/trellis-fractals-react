import type { TrellisDb } from 'trellis/client/sdk';
import { KanbanCard } from '@/lib/schemas/kanban-card';

const STARTER_CARDS = [
  { title: 'Your first card', status: 'backlog' as const },
  { title: 'Drag me to Doing', status: 'backlog' as const },
  { title: 'Edit this title inline', status: 'doing' as const },
];

/** Seed a fresh session tenant with a small kanban (idempotent). */
export async function seedSessionKanbanIfEmpty(client: TrellisDb): Promise<void> {
  await client.registerType(KanbanCard);
  const list = await client.list('KanbanCard', { limit: 1 });
  if ((list.total ?? 0) > 0) return;

  for (const card of STARTER_CARDS) {
    await client.create('KanbanCard', card);
  }
}
