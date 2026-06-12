import type { TrellisDb } from 'trellis/client/sdk';
import type { AnyType } from 'trellis/schema';
import { CollectionMetaType, CollectionRecordType } from '@/lib/schemas/collection';
import { FractalThing } from '@/lib/schemas/fractal-thing';

/** Explorer types registered idempotently from the browser on mount. */
export const EXPLORER_SCHEMAS: AnyType[] = [
  CollectionMetaType,
  CollectionRecordType,
  FractalThing,
];

export async function bootstrapExplorerSchemas(client: TrellisDb): Promise<void> {
  for (const schema of EXPLORER_SCHEMAS) {
    await client.registerType(schema);
  }
}
