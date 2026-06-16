'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/lib/trellis/use-collection';
import { useTypes } from '@/lib/trellis/use-types';
import {
  CollectionMetaType,
  CollectionRecordType,
  canSubmitRecordForm,
  normalizeRecordAttributes,
  sortMeta,
  sortRecords,
  validateRecordFromType,
  type CollectionMeta,
  type CollectionRecord,
} from '@/lib/schemas/collection';
import { editableTypeFields, resolveCollectionType } from '@/lib/registry/type-columns';
import type { MentionCandidate, MentionSource } from '@/lib/links/trellis-mention';
import { RecordFormPage } from '@/components/forms/shells/record-form-page';
import { emptyRecordValues } from '@/lib/forms/record-form-values';

function stableCollectionId(collection: CollectionMeta): string {
  return `collectionMeta:${collection.slug}`;
}

function recordBelongsToCollection(record: CollectionRecord, collection: CollectionMeta): boolean {
  return record.collectionId === collection.id || record.collectionId === stableCollectionId(collection);
}

export function CollectionNewRecordPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { types } = useTypes();
  const { rows: metaRows, loading: metaLoading } = useCollection(CollectionMetaType);
  const { rows: recordRows, mut: recordMut, loading: recordsLoading } =
    useCollection(CollectionRecordType);

  const collection = useMemo(() => {
    const collections = sortMeta(metaRows as CollectionMeta[]);
    return collections.find((item) => item.slug === slug) ?? null;
  }, [metaRows, slug]);

  const activeType = useMemo(() => resolveCollectionType(types, slug), [types, slug]);
  const editableFields = useMemo(
    () => editableTypeFields(activeType.fields),
    [activeType.fields],
  );

  const rows = useMemo(
    () =>
      collection
        ? sortRecords(
            (recordRows as CollectionRecord[]).filter((record) =>
              recordBelongsToCollection(record, collection),
            ),
          )
        : [],
    [collection, recordRows],
  );

  const mentionSource = useCallback<MentionSource>(
    (query: string) => {
      const q = query.trim().toLowerCase();
      const candidates: MentionCandidate[] = rows.map((record) => ({
        id: record.id,
        label: String((record as Record<string, unknown>).title ?? record.id),
        type: 'record',
      }));
      const filtered = q
        ? candidates.filter((candidate) => candidate.label.toLowerCase().includes(q))
        : candidates;
      return filtered.slice(0, 8);
    },
    [rows],
  );

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(emptyRecordValues(editableFields));
  }, [editableFields]);

  const canCreate = canSubmitRecordForm(editableFields, values);
  const collectionHref = `/collections/${slug}`;

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!collection) return;

    const attributes = normalizeRecordAttributes(editableFields, values);
    const check = validateRecordFromType(editableFields, attributes);
    if (!check.ok) {
      setCreateError(check.message);
      setCreateFieldErrors(check.fieldErrors);
      return;
    }
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    setCreateFieldErrors({});
    try {
      await recordMut.create({
        collectionId: stableCollectionId(collection),
        sortOrder: rows.length,
        laneId: 'main',
        ...attributes,
      } as Parameters<typeof recordMut.create>[0]);
      router.push(collectionHref);
    } finally {
      setCreating(false);
    }
  }

  function handleFieldChange(fieldName: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    if (createFieldErrors[fieldName]) {
      setCreateFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }

  if (metaLoading || recordsLoading) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>;
  }

  if (!collection) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">Collection not found.</p>;
  }

  return (
    <RecordFormPage
      title="New record"
      description={`Add a row to ${collection.title}.`}
      collectionTitle={collection.title}
      collectionHref={collectionHref}
      fields={editableFields}
      values={values}
      fieldErrors={createFieldErrors}
      formError={createError}
      formErrorTestId="create-record-error"
      idPrefix="new-record"
      submitting={creating}
      submitLabel="Add record"
      submitDisabled={!canCreate}
      mentionSource={mentionSource}
      layout={activeType.formLayout}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
    />
  );
}
