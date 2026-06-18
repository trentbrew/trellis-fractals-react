import { defineType, type InferType } from 'trellis/schema';
import { z } from 'zod';

/**
 * A word spawned into the shared arena. One Spawn = one creature in the world.
 * Position (x, y) is normalized 0..1 so it maps onto any viewport; drift/bob is
 * rendered client-side from a hash of `id`, so the field looks alive without
 * syncing per-frame — the *spawn* is the synced event, Trellis live-queries push
 * it to every peer in the room.
 */
export const SpawnType = defineType(
  'Spawn',
  {
    room: z.string().min(1).max(64),
    word: z.string().min(1).max(40),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    hue: z.number().int().min(0).max(360),
    owner: z.string().min(1).max(40),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a 6-digit hex string'),
    createdAt: z.number(),
  },
  { title: 'word' },
);

export type Spawn = InferType<typeof SpawnType>;

export function sortSpawns(spawns: Spawn[]): Spawn[] {
  return [...spawns].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
