'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { TypeFieldsEditor } from '@/components/collections/type-fields-editor';
import { TypeSchemaReadonly } from '@/components/collections/type-schema-readonly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  globalTypeId,
  listManageableTypes,
  typeDisplayLabel,
  typeKind,
} from '@/lib/registry/type-utils';
import {
  DEFAULT_COLLECTION_RECORD_FIELDS,
} from '@/lib/schemas/collection';
import { useTypes } from '@/lib/trellis/use-types';

export function TypesHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { types, loading, error, createType } = useTypes();
  const [typeName, setTypeName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const selectedTypeId = searchParams.get('type');

  const manageable = useMemo(() => listManageableTypes(types), [types]);

  const selectedType = useMemo(
    () => manageable.find((type) => type['@id'] === selectedTypeId) ?? null,
    [manageable, selectedTypeId],
  );

  function openEditor(typeId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', typeId);
    router.replace(`/collections/types?${params.toString()}`, { scroll: false });
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const name = typeName.trim();
    if (!name || creating) return;

    setCreating(true);
    setCreateError(null);
    try {
      const id = globalTypeId(name);
      await createType({
        '@id': id,
        label: name,
        fields: DEFAULT_COLLECTION_RECORD_FIELDS,
      });
      setTypeName('');
      const params = new URLSearchParams();
      params.set('type', id);
      router.replace(`/collections/types?${params.toString()}`, { scroll: false });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create type');
    } finally {
      setCreating(false);
    }
  }

  if (selectedType) {
    return (
      <div className="flex min-h-0 flex-1 flex-col" data-testid="types-home">
        <TypeSchemaReadonly
          type={selectedType}
          fields={selectedType.fields ?? []}
          includeSystemFields={typeKind(selectedType) === 'collection'}
          onEdit={() => openEditor(selectedType['@id'])}
        />

        <TypeFieldsEditor
          open={editorOpen}
          onOpenChange={(open) => {
            if (!open) closeEditor();
            else setEditorOpen(true);
          }}
          typeId={selectedType['@id']}
          label={typeDisplayLabel(selectedType)}
          fields={selectedType.fields ?? []}
          includeSystemFields={typeKind(selectedType) === 'collection'}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-4" data-testid="types-home">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Types</h1>
        <p className="text-sm text-muted-foreground">
          Select a type from the sidebar to preview its fields, or create a new global type below.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-destructive">
          Sidecar unavailable — start Trellis on port 8230.
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium">Create type</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Global types can be reused across collections.
        </p>
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={handleCreate}>
          <div className="min-w-[12rem] flex-1 space-y-1">
            <label htmlFor="new-type-name" className="text-xs font-medium text-muted-foreground">
              Type name
            </label>
            <Input
              id="new-type-name"
              value={typeName}
              onChange={(event) => setTypeName(event.currentTarget.value)}
              placeholder="Note"
              data-testid="types-create-name"
            />
          </div>
          <Button type="submit" disabled={creating || !typeName.trim()} data-testid="types-create-submit">
            <PlusIcon className="size-3.5" />
            {creating ? 'Creating…' : 'Create type'}
          </Button>
        </form>
        {createError ? <p className="mt-2 text-sm text-destructive">{createError}</p> : null}
      </section>

      {loading ? <p className="text-sm text-muted-foreground">Loading types…</p> : null}
    </div>
  );
}
