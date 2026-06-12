import { DEMO_NS } from '@/lib/schemas/collection';
import { FRACTAL_LANES, FRACTAL_STATUSES } from '@/lib/schemas/fractal-thing';
import type { TypeDef } from '@/lib/trellis/use-types';

/** Matches `scripts/register-collection-type.mjs` — sidecar only implements POST. */
export const DEMO_TYPE_SEEDS: TypeDef[] = [
  {
    '@id': `${DEMO_NS}/CollectionMeta`,
    label: 'CollectionMeta',
    fields: [
      { name: 'title', valueType: 'title', required: true },
      { name: 'slug', valueType: 'rich_text', required: true },
      { name: 'icon', valueType: 'rich_text' },
      { name: 'color', valueType: 'rich_text' },
      { name: 'description', valueType: 'rich_text' },
      { name: 'sortOrder', valueType: 'number' },
    ],
  },
  {
    '@id': `${DEMO_NS}/CollectionRecord`,
    label: 'CollectionRecord',
    fields: [
      { name: 'collectionId', valueType: 'rich_text', required: true },
      { name: 'title', valueType: 'title', required: true },
      { name: 'body', valueType: 'rich_text' },
      { name: 'sortOrder', valueType: 'number' },
      { name: 'laneId', valueType: 'rich_text' },
    ],
  },
  {
    '@id': `${DEMO_NS}/FractalThing`,
    label: 'FractalThing',
    fields: [
      { name: 'identity', valueType: 'rich_text', required: true },
      { name: 'title', valueType: 'title', required: true },
      { name: 'collectionId', valueType: 'rich_text', required: true },
      {
        name: 'laneId',
        valueType: 'enum',
        required: true,
        options: [...FRACTAL_LANES],
      },
      {
        name: 'status',
        valueType: 'enum',
        required: true,
        options: [...FRACTAL_STATUSES],
      },
      { name: 'body', valueType: 'rich_text' },
    ],
  },
];
