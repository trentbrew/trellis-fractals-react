'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { TypeFieldsEditor } from '@/components/collections/type-fields-editor';
import { TypeAppearanceControls } from '@/components/icons/type-appearance-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTypeAppearance } from '@/lib/registry/type-appearance';
import {
  collectionSlugFromTypeId,
  fieldCountSummary,
  globalTypeId,
  listManageableTypes,
  typeDisplayLabel,
  typeKind,
} from '@/lib/registry/type-utils';
import {
  CollectionMetaType,
  DEFAULT_COLLECTION_RECORD_FIELDS,
  sortMeta,
  type CollectionMeta,
} from '@/lib/schemas/collection';
import type { TypeDef } from '@/lib/trellis/use-types';
import { useCollection } from '@/lib/trellis/use-collection';
import { useTypes } from '@/lib/trellis/use-types';

export function TypesHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { types, loading, error, createType } = useTypes();
  const { rows: metaRows } = useCollection(CollectionMetaType);
  const collections = useMemo(
    () => sortMeta(metaRows as CollectionMeta[]),
    [metaRows],
  );
  const { getTypeColor, setTypeColor, getTypeIcon, setTypeIcon } =
    useTypeAppearance(collections);
  const [typeName, setTypeName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const selectedTypeId = searchParams.get('type');

  const manageable = useMemo(() => listManageableTypes(types), [types]);

  const globalTypes = useMemo(
    () => manageable.filter((type) => typeKind(type) === 'global'),
    [manageable],
  );

  const collectionTypes = useMemo(
    () => manageable.filter((type) => typeKind(type) === 'collection'),
    [manageable],
  );

  const selectedType = useMemo(
    () => manageable.find((type) => type['@id'] === selectedTypeId) ?? null,
    [manageable, selectedTypeId],
  );

  useEffect(() => {
    if (selectedTypeId && selectedType) {
      setEditorOpen(true);
    }
  }, [selectedTypeId, selectedType]);

  function openEditor(typeId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', typeId);
    router.replace(`/collections/types?${params.toString()}`, { scroll: false });
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    router.replace('/collections/types', { scroll: false });
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
      openEditor(id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create type');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8" data-testid="types-home">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Types</h1>
        <p className="text-sm text-muted-foreground">
          Record shapes registered on Trellis — global types and per-collection schemas.
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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading types…</p>
      ) : (
        <>
          <TypeSection
            title="Global types"
            emptyMessage="No global types yet — create one above."
            types={globalTypes}
            getTypeColor={getTypeColor}
            setTypeColor={setTypeColor}
            getTypeIcon={getTypeIcon}
            setTypeIcon={setTypeIcon}
            onEdit={openEditor}
          />

          <TypeSection
            title="Collection schemas"
            emptyMessage="Per-collection schemas appear here after you edit a collection's fields."
            types={collectionTypes}
            getTypeColor={getTypeColor}
            setTypeColor={setTypeColor}
            getTypeIcon={getTypeIcon}
            setTypeIcon={setTypeIcon}
            onEdit={openEditor}
            showCollectionLink
          />
        </>
      )}

      {selectedType ? (
        <TypeFieldsEditor
          open={editorOpen || selectedTypeId === selectedType['@id']}
          onOpenChange={(open) => {
            if (!open) closeEditor();
            else setEditorOpen(true);
          }}
          typeId={selectedType['@id']}
          label={typeDisplayLabel(selectedType)}
          fields={selectedType.fields ?? []}
          includeSystemFields={typeKind(selectedType) === 'collection'}
        />
      ) : null}
    </div>
  );
}

function TypeSection({
  title,
  emptyMessage,
  types,
  getTypeColor,
  setTypeColor,
  getTypeIcon,
  setTypeIcon,
  onEdit,
  showCollectionLink = false,
}: {
  title: string;
  emptyMessage: string;
  types: TypeDef[];
  getTypeColor: (type: TypeDef, fallbackIndex?: number) => string;
  setTypeColor: (type: TypeDef, color: string) => Promise<void>;
  getTypeIcon: (type: TypeDef) => string;
  setTypeIcon: (type: TypeDef, icon: string) => Promise<void>;
  onEdit: (typeId: string) => void;
  showCollectionLink?: boolean;
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {types.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {types.map((type, index) => {
            const typeId = type['@id'];
            const label = typeDisplayLabel(type);
            const color = getTypeColor(type, index);
            const icon = getTypeIcon(type);
            const collectionSlug = showCollectionLink
              ? collectionSlugFromTypeId(typeId)
              : null;

            return (
              <li
                key={typeId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                data-testid="types-list-item"
              >
                <TypeAppearanceControls
                  icon={icon}
                  color={color}
                  label={label}
                  onIconChange={(next) => void setTypeIcon(type, next)}
                  onColorChange={(next) => void setTypeColor(type, next)}
                  iconButtonTestId="types-edit-icon"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {fieldCountSummary(type.fields)}
                    {collectionSlug ? (
                      <>
                        {' · '}
                        <Link
                          href={`/collections/${collectionSlug}?configure=schema`}
                          className="underline-offset-2 hover:underline"
                        >
                          Open schema
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => onEdit(typeId)}
                  data-testid="types-edit-fields"
                >
                  <PencilIcon className="size-3.5" />
                  Edit fields
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
