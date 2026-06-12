'use client';

import { useMemo } from 'react';
import type { InferType } from 'trellis/schema';
import { useCollection } from '@/lib/trellis/use-collection';
import { Task } from '@/lib/schemas/task';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { JsonLdMonacoEditor } from '@/components/json-ld/json-ld-monaco-editor';

const JSON_LD_CONTEXT = {
  '@vocab': 'https://trellis.computer/type/',
  trellis: 'https://trellis.computer/ns#',
};

function toJsonLdEntity(row: InferType<typeof Task>) {
  const { id, type, ...attributes } = row;
  return {
    '@id': `trellis:${id}`,
    '@type': type,
    ...attributes,
  };
}

export function JsonLdBoard() {
  const { rows, loading } = useCollection(Task);

  const document = useMemo(
    () =>
      JSON.stringify(
        {
          '@context': JSON_LD_CONTEXT,
          '@graph': rows.map(toJsonLdEntity),
        },
        null,
        2,
      ),
    [rows],
  );

  return (
    <BrowseProjectionShell className="min-h-0 flex-1 gap-4">
      <ProjectionHeader title="JSON-LD">
        <CollectionViewHint schema={Task} current="json-ld" />
      </ProjectionHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading entities…</p>
        ) : (
          <JsonLdMonacoEditor value={document} />
        )}
      </div>
    </BrowseProjectionShell>
  );
}
