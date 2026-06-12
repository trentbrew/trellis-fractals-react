/**
 * Ambient module declarations for `trellis/react` and `trellis/react/typed`.
 *
 * trellis@3.2.2 ships these as plain `.js` (no `.d.ts`, despite the package.json
 * `exports` map pointing at `dist/react/{index,schema-hooks}.d.ts`) — shimmed here
 * from the shipped `.js` + the analogous `trellis/svelte/typed` `.d.ts`.
 */

declare module 'trellis/react' {
  import type { TrellisDb } from 'trellis/client/sdk';

  export function TrellisProvider(props: {
    url: string;
    apiKey?: string;
    tenantId?: string;
    children?: React.ReactNode;
  }): React.ReactElement;

  export function useTrellis(): TrellisDb;
}

declare module 'trellis/react/typed' {
  import type { LiveEntitiesOptions, LiveEntityOptions } from 'trellis/client/live';
  import type {
    AnyType,
    EntityMutations,
    InferEntitiesRead,
    InferEntityRead,
    InferType,
    ResolveSpecFor,
    WhereInput,
  } from 'trellis/schema';

  export interface TypedRead<T> {
    data: T;
    loading: boolean;
    error: Error | null;
  }

  export type TypedReadOptions<S extends AnyType> = LiveEntitiesOptions & {
    where?: WhereInput;
    resolve?: ResolveSpecFor<S>;
  };

  export type TypedEntityOptions<S extends AnyType> = LiveEntityOptions & {
    resolve?: ResolveSpecFor<S>;
  };

  export function useEntities<
    S extends AnyType,
    O extends Partial<InferType<S>> | TypedReadOptions<S> | undefined = undefined,
  >(schema: S, opts?: O): TypedRead<InferEntitiesRead<S, O>>;

  export function useEntity<
    S extends AnyType,
    O extends TypedEntityOptions<S> | undefined = undefined,
  >(schema: S, id: string | null | undefined, opts?: O): TypedRead<InferEntityRead<S, O>>;

  export function useMutation<S extends AnyType>(schema: S): EntityMutations<InferType<S>>;
}

declare module 'trellis/react/realtime' {
  import type { RealtimeRoom, PresencePeer, PresenceState } from 'trellis/realtime';

  export function useRoom<P extends PresenceState = PresenceState>(
    create: () => RealtimeRoom<P>,
    deps?: unknown[],
  ): {
    room: RealtimeRoom<P> | null;
    presence: PresencePeer<P>[];
    others: PresencePeer<P>[];
  };

  export function usePresence<P extends PresenceState = PresenceState>(
    room: RealtimeRoom<P> | null | undefined,
  ): PresencePeer<P>[];

  export function useSignal<T>(signal: { subscribe(cb: () => void): () => void; peek(): T }): T;
}
