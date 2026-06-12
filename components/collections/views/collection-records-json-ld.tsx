'use client';

import { useMemo } from 'react';
import type { CollectionRecord } from '@/lib/schemas/collection';
import { CollectionRecordType } from '@/lib/schemas/collection';
import { JsonLdMonacoEditor } from '@/components/json-ld/json-ld-monaco-editor';

const JSON_LD_CONTEXT = {
  '@vocab': 'https://trellis.computer/type/',
  trellis: 'https://trellis.computer/ns#',
};

function toJsonLdEntity(record: CollectionRecord) {
  const { id, type, ...attributes } = record;
  return {
    '@id': `trellis:${id}`,
    '@type': type ?? CollectionRecordType.type,
    ...attributes,
  };
}

export function CollectionRecordsJsonLdView({ records }: { records: CollectionRecord[] }) {
  const document = useMemo(
    () =>
      JSON.stringify(
        {
          '@context': JSON_LD_CONTEXT,
          '@graph': records.map(toJsonLdEntity),
        },
        null,
        2,
      ),
    [records],
  );

  return (
    <JsonLdMonacoEditor
      data-testid="collection-json-ld-view"
      value={document}
    />
  );
}
