import type { TrellisDb } from 'trellis/client/sdk';
import type { AnyType } from 'trellis/schema';
import { CollectionMetaType, CollectionRecordType } from '@/lib/schemas/collection';
import { ChatMessageType } from '@/lib/schemas/chat-message';
import { PostCommentType, PostLikeType } from '@/lib/schemas/post-interaction';
import { FractalThing } from '@/lib/schemas/fractal-thing';

/** Explorer types registered idempotently from the browser on mount. */
export const EXPLORER_SCHEMAS: AnyType[] = [
  CollectionMetaType,
  CollectionRecordType,
  ChatMessageType,
  PostLikeType,
  PostCommentType,
  FractalThing,
];

export async function bootstrapExplorerSchemas(client: TrellisDb): Promise<void> {
  for (const schema of EXPLORER_SCHEMAS) {
    await client.registerType(schema);
  }
}
