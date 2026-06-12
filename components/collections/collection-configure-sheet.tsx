'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SettingsIcon } from 'lucide-react';
import { TypeAppearanceControls } from '@/components/icons/type-appearance-controls';
import { EntityIcon } from '@/lib/icons/entity-icon';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import type { CollectionMeta, TypeField } from '@/lib/schemas/collection';
import { CollectionSchemaFieldsEditor } from '@/components/collections/collection-schema-editor';
import { CollectionViewsEditor } from '@/components/collections/collection-views-editor';
import type { CollectionViewMode } from '@/lib/registry/collection-views';
import type { CollectionViewPrefs } from '@/lib/schemas/collection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type ConfigureTab = 'general' | 'schema' | 'views';

type CollectionConfigureSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: ConfigureTab;
  onTabChange: (tab: ConfigureTab) => void;
  collection: CollectionMeta;
  collectionIcon: string;
  collectionColor: string;
  fields: TypeField[];
  startWithNewField?: boolean;
  onSaveTitle: (title: string) => Promise<void>;
  onSaveDescription: (description: string) => Promise<void>;
  onSaveAppearance: (updates: { icon?: string; color?: string }) => Promise<void>;
  onSaveViews: (updates: {
    defaultView?: CollectionViewMode;
    viewPrefs?: CollectionViewPrefs;
  }) => Promise<void>;
};

function GeneralDescriptionInput({
  description,
  onSave,
}: {
  description: string;
  onSave: (description: string) => void;
}) {
  const field = useFocusSafeField(description, onSave);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="configure-description">
        Description
      </label>
      <Input
        id="configure-description"
        value={field.value}
        onChange={field.onChange}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
        onKeyDown={field.onKeyDown}
        placeholder="Optional collection description"
        data-testid="collection-configure-description"
      />
    </div>
  );
}

function ConfigureTabTrigger({
  active,
  onClick,
  testId,
  children,
}: {
  active: boolean;
  onClick: () => void;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

export function CollectionConfigureTrigger({
  onClick,
  showLabel = false,
}: {
  onClick: () => void;
  showLabel?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'sm' : 'icon-sm'}
      className={cn('shrink-0 text-muted-foreground', showLabel && 'gap-1.5')}
      onClick={onClick}
      aria-label="configure entity"
      data-testid="collection-configure-trigger"
    >
      <SettingsIcon className="size-4" />
      {showLabel ? <span>configure entity</span> : null}
    </Button>
  );
}

export function CollectionHeaderBadge({
  icon,
  color,
  label,
}: {
  icon: string;
  color: string;
  label: string;
}) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border md:size-9"
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden
      title={label}
    >
      <EntityIcon name={icon} className="size-4" />
    </span>
  );
}

export function CollectionConfigureSheet({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  collection,
  collectionIcon,
  collectionColor,
  fields,
  startWithNewField = false,
  onSaveTitle,
  onSaveDescription,
  onSaveAppearance,
  onSaveViews,
}: CollectionConfigureSheetProps) {
  const [draftTitle, setDraftTitle] = useState(collection.title);
  const [draftDescription, setDraftDescription] = useState(collection.description ?? '');
  const [draftIcon, setDraftIcon] = useState(collectionIcon);
  const [draftColor, setDraftColor] = useState(collectionColor);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [schemaDirty, setSchemaDirty] = useState(false);
  const [viewsDirty, setViewsDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftTitle(collection.title);
    setDraftDescription(collection.description ?? '');
    setDraftIcon(collectionIcon);
    setDraftColor(collectionColor);
    setGeneralError(null);
    setSchemaDirty(false);
    setViewsDirty(false);
    setDiscardConfirmOpen(false);
  }, [open, collection.title, collection.description, collectionIcon, collectionColor]);

  const generalDirty = useMemo(() => {
    if (!open) return false;
    return (
      draftTitle.trim() !== collection.title ||
      draftDescription.trim() !== (collection.description ?? '').trim() ||
      draftIcon !== collectionIcon ||
      draftColor !== collectionColor
    );
  }, [
    open,
    draftTitle,
    draftDescription,
    draftIcon,
    draftColor,
    collection.title,
    collection.description,
    collectionIcon,
    collectionColor,
  ]);

  const isDirty = generalDirty || schemaDirty || viewsDirty;

  const requestClose = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }
      if (isDirty && !generalSaving) {
        setDiscardConfirmOpen(true);
        return;
      }
      onOpenChange(false);
    },
    [isDirty, generalSaving, onOpenChange],
  );

  async function saveGeneral() {
    setGeneralSaving(true);
    setGeneralError(null);
    try {
      const trimmedTitle = draftTitle.trim();
      if (trimmedTitle && trimmedTitle !== collection.title) {
        await onSaveTitle(trimmedTitle);
      }
      const trimmedDescription = draftDescription.trim();
      if (trimmedDescription !== (collection.description ?? '').trim()) {
        await onSaveDescription(trimmedDescription);
      }
      if (draftIcon !== collectionIcon || draftColor !== collectionColor) {
        await onSaveAppearance({
          ...(draftIcon !== collectionIcon ? { icon: draftIcon } : {}),
          ...(draftColor !== collectionColor ? { color: draftColor } : {}),
        });
      }
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setGeneralSaving(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          side="right"
          className="flex w-full flex-col sm:max-w-lg"
          data-testid="collection-configure-sheet"
        >
          <SheetHeader>
            <SheetTitle>Configure collection</SheetTitle>
            <SheetDescription>
              Edit {collection.title} metadata and record schema.
            </SheetDescription>
          </SheetHeader>

          <div
            className="flex shrink-0 gap-1 border-b border-border px-4 pb-3"
            role="tablist"
            aria-label="Configure sections"
          >
            <ConfigureTabTrigger
              active={activeTab === 'general'}
              onClick={() => onTabChange('general')}
              testId="collection-configure-tab-general"
            >
              General
            </ConfigureTabTrigger>
            <ConfigureTabTrigger
              active={activeTab === 'schema'}
              onClick={() => onTabChange('schema')}
              testId="collection-configure-tab-schema"
            >
              Schema
            </ConfigureTabTrigger>
            <ConfigureTabTrigger
              active={activeTab === 'views'}
              onClick={() => onTabChange('views')}
              testId="collection-configure-tab-views"
            >
              Views
            </ConfigureTabTrigger>
          </div>

          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4',
              activeTab !== 'general' && 'hidden',
            )}
            role="tabpanel"
            aria-hidden={activeTab !== 'general'}
            data-testid="collection-configure-general"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="configure-title">
                Title
              </label>
              <Input
                id="configure-title"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.currentTarget.value)}
                data-testid="collection-configure-title"
              />
            </div>

            <GeneralDescriptionInput
              description={draftDescription}
              onSave={setDraftDescription}
            />

            <section className="rounded-lg border border-border p-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Type appearance
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Icon and color for this collection&apos;s record type.
              </p>
              <div className="mt-3">
                <TypeAppearanceControls
                  icon={draftIcon}
                  color={draftColor}
                  label={draftTitle || collection.title}
                  onIconChange={setDraftIcon}
                  onColorChange={setDraftColor}
                  iconButtonTestId="configure-edit-icon"
                />
              </div>
            </section>

            {generalError ? (
              <p className="text-sm text-destructive">{generalError}</p>
            ) : null}

            <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => requestClose(false)}
                disabled={generalSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void saveGeneral()}
                disabled={generalSaving || !generalDirty}
              >
                {generalSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col',
              activeTab !== 'schema' && 'hidden',
            )}
            role="tabpanel"
            aria-hidden={activeTab !== 'schema'}
            data-testid="collection-configure-schema"
          >
            <CollectionSchemaFieldsEditor
              collectionTitle={collection.title}
              collectionSlug={collection.slug}
              fields={fields}
              startWithNewField={startWithNewField}
              onDirtyChange={setSchemaDirty}
              onClose={() => onOpenChange(false)}
              onRequestClose={requestClose}
            />
          </div>

          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col',
              activeTab !== 'views' && 'hidden',
            )}
            role="tabpanel"
            aria-hidden={activeTab !== 'views'}
            data-testid="collection-configure-views"
          >
            <CollectionViewsEditor
              collection={collection}
              fields={fields}
              onDirtyChange={setViewsDirty}
              onClose={() => onOpenChange(false)}
              onRequestClose={requestClose}
              onSave={onSaveViews}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <DialogContent showCloseButton={false} data-testid="configure-discard-dialog">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Your edits have not been saved. Discard them and close configure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDiscardConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDiscardConfirmOpen(false);
                onOpenChange(false);
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
