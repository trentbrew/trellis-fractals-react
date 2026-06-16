'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import {
  collectionRecordTypeId,
  type TypeField,
} from '@/lib/schemas/collection';
import { editableTypeFields, fieldLabel } from '@/lib/registry/type-columns';
import {
  formLayoutSnapshot,
  normalizeFormLayout,
  shouldUseWizardLayout,
  type FormLayout,
  type FormLayoutSection,
  type FormShellKind,
} from '@/lib/forms/record-form-layout';
import { resolveFormShell } from '@/lib/forms/resolve-form-shell';
import { useTypes } from '@/lib/trellis/use-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';

type DialogShellDraft = FormShellKind | 'auto';

type FormLayoutDraft = {
  dialogShell: DialogShellDraft;
  columns: 1 | 2;
  hiddenInForm: string[];
  sections: FormLayoutSection[];
};

const SHELL_OPTIONS: { value: DialogShellDraft; label: string }[] = [
  { value: 'auto', label: 'Auto (context)' },
  { value: 'sheet', label: 'Sheet (sidebar)' },
  { value: 'dialog', label: 'Dialog' },
  { value: 'page', label: 'Full page (/new)' },
  { value: 'wizard', label: 'Wizard (multi-step)' },
];

function emptySection(): FormLayoutSection {
  return { title: '', fields: [] };
}

function draftFromType(
  dialogShell: FormShellKind | undefined,
  formLayout: FormLayout | undefined,
): FormLayoutDraft {
  return {
    dialogShell: dialogShell ?? 'auto',
    columns: formLayout?.columns === 2 ? 2 : 1,
    hiddenInForm: [...(formLayout?.hiddenInForm ?? [])],
    sections: (formLayout?.sections ?? []).map((section) => ({
      title: section.title ?? '',
      description: section.description ?? '',
      fields: [...section.fields],
    })),
  };
}

function draftSnapshot(draft: FormLayoutDraft, fieldNames: string[]): string {
  const layout = normalizeFormLayout(
    {
      columns: draft.columns === 2 ? 2 : undefined,
      hiddenInForm: draft.hiddenInForm,
      sections: draft.sections,
    },
    fieldNames,
  );
  return JSON.stringify({
    dialogShell: draft.dialogShell,
    layout: formLayoutSnapshot(layout),
  });
}

type CollectionFormLayoutEditorProps = {
  collectionTitle: string;
  collectionSlug: string;
  fields: TypeField[];
  dialogShell?: FormShellKind;
  formLayout?: FormLayout;
  onDirtyChange?: (dirty: boolean) => void;
  onClose: () => void;
  onRequestClose: (open: boolean) => void;
};

export function CollectionFormLayoutEditor({
  collectionTitle,
  collectionSlug,
  fields,
  dialogShell,
  formLayout,
  onDirtyChange,
  onClose,
  onRequestClose,
}: CollectionFormLayoutEditorProps) {
  const { types, loading, createType, updateType } = useTypes();
  const typeId = collectionRecordTypeId(collectionSlug);
  const editableFields = useMemo(() => editableTypeFields(fields), [fields]);
  const fieldNames = useMemo(
    () => editableFields.map((field) => field.name),
    [editableFields],
  );

  const [draft, setDraft] = useState<FormLayoutDraft>(() =>
    draftFromType(dialogShell, formLayout),
  );
  const [baseline, setBaseline] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const next = draftFromType(dialogShell, formLayout);
    setDraft(next);
    setBaseline(draftSnapshot(next, editableTypeFields(fields).map((f) => f.name)));
    setSaveError(null);
    setInitialized(true);
  }, [dialogShell, formLayout, fields]);

  const isDirty = useMemo(
    () => initialized && draftSnapshot(draft, fieldNames) !== baseline,
    [initialized, draft, baseline, fieldNames],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const normalizedLayout = useMemo(
    () =>
      normalizeFormLayout(
        {
          columns: draft.columns === 2 ? 2 : undefined,
          hiddenInForm: draft.hiddenInForm,
          sections: draft.sections,
        },
        fieldNames,
      ),
    [draft, fieldNames],
  );

  const shellPreview = useMemo(
    () =>
      resolveFormShell({
        intent: 'create',
        fieldCount: fieldNames.length,
        dialogShell: draft.dialogShell === 'auto' ? undefined : draft.dialogShell,
        formLayout: normalizedLayout,
      }),
    [draft.dialogShell, fieldNames.length, normalizedLayout],
  );

  const wizardHint = shouldUseWizardLayout(normalizedLayout);

  function toggleHidden(fieldName: string, checked: boolean) {
    setDraft((prev) => ({
      ...prev,
      hiddenInForm: checked
        ? [...prev.hiddenInForm, fieldName]
        : prev.hiddenInForm.filter((name) => name !== fieldName),
    }));
    setSaveError(null);
  }

  function updateSection(index: number, patch: Partial<FormLayoutSection>) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section,
      ),
    }));
    setSaveError(null);
  }

  function toggleSectionField(sectionIndex: number, fieldName: string, checked: boolean) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index !== sectionIndex) return section;
        const fieldsInSection = new Set(section.fields);
        if (checked) fieldsInSection.add(fieldName);
        else fieldsInSection.delete(fieldName);
        return { ...section, fields: [...fieldsInSection] };
      }),
    }));
    setSaveError(null);
  }

  function addSection() {
    setDraft((prev) => ({
      ...prev,
      sections: [...prev.sections, emptySection()],
    }));
  }

  function removeSection(index: number) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, sectionIndex) => sectionIndex !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const layout = normalizedLayout;
      const exists = types.some((type) => type['@id'] === typeId);
      const shellUpdate =
        draft.dialogShell === 'auto'
          ? { dialogShell: undefined as FormShellKind | undefined }
          : { dialogShell: draft.dialogShell };

      if (exists) {
        await updateType(typeId, {
          ...shellUpdate,
          formLayout: layout ?? undefined,
        });
      } else {
        await createType({
          '@id': typeId,
          label: `${collectionTitle} records`,
          fields,
          ...(draft.dialogShell !== 'auto' ? { dialogShell: draft.dialogShell } : {}),
          ...(layout ? { formLayout: layout } : {}),
        });
      }
      setBaseline(draftSnapshot(draft, fieldNames));
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save form layout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="collection-form-layout-editor">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading form settings…
          </div>
        ) : (
          <>
            <FieldSet>
              <FieldLegend variant="label">Create / edit shell</FieldLegend>
              <FieldDescription>
                How record forms open. Auto picks sheet for create and dialog for edit; two or
                more sections enable wizard unless overridden.
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="form-shell-select">Shell</FieldLabel>
                  <Select
                    value={draft.dialogShell}
                    onValueChange={(value) => {
                      if (!value) return;
                      setDraft((prev) => ({
                        ...prev,
                        dialogShell: value as DialogShellDraft,
                      }));
                      setSaveError(null);
                    }}
                  >
                    <SelectTrigger id="form-shell-select" data-testid="form-shell-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHELL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription data-testid="form-shell-preview">
                    Preview (create): <span className="font-medium text-foreground">{shellPreview}</span>
                    {wizardHint && draft.dialogShell === 'auto' ? ' · wizard from sections' : null}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="form-columns-select">Columns</FieldLabel>
                  <Select
                    value={String(draft.columns)}
                    onValueChange={(value) => {
                      setDraft((prev) => ({
                        ...prev,
                        columns: value === '2' ? 2 : 1,
                      }));
                      setSaveError(null);
                    }}
                  >
                    <SelectTrigger id="form-columns-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single column</SelectItem>
                      <SelectItem value="2">Two columns (md+)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </FieldSet>

            {fieldNames.length > 0 ? (
              <FieldSet>
                <FieldLegend variant="label">Hidden in forms</FieldLegend>
                <FieldDescription>
                  Hidden fields stay in the table and JSON views but not in create/edit forms.
                </FieldDescription>
                <FieldGroup data-testid="form-hidden-fields">
                  {editableFields.map((field) => (
                    <Field key={field.name} orientation="horizontal">
                      <Checkbox
                        id={`form-hidden-${field.name}`}
                        checked={draft.hiddenInForm.includes(field.name)}
                        onCheckedChange={(checked) =>
                          toggleHidden(field.name, checked === true)
                        }
                      />
                      <FieldLabel htmlFor={`form-hidden-${field.name}`} className="font-normal">
                        {fieldLabel(field.name)}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            ) : null}

            <FieldSet>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <FieldLegend variant="label">Sections</FieldLegend>
                  <FieldDescription>
                    Group fields for wizard steps or visual sections. Two or more sections auto-enable
                    the wizard shell.
                  </FieldDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={addSection}
                  data-testid="form-add-section"
                >
                  <PlusIcon className="size-3.5" />
                  Add section
                </Button>
              </div>

              {draft.sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sections — all visible fields render in one group.
                </p>
              ) : (
                <FieldGroup className="gap-4">
                  {draft.sections.map((section, sectionIndex) => (
                    <div
                      key={`section-${sectionIndex}`}
                      className="space-y-3 rounded-lg border border-border p-3"
                      data-testid="form-section-row"
                    >
                      <div className="flex items-start gap-2">
                        <div className="grid min-w-0 flex-1 gap-2">
                          <Input
                            value={section.title ?? ''}
                            onChange={(event) =>
                              updateSection(sectionIndex, { title: event.currentTarget.value })
                            }
                            placeholder={`Section ${sectionIndex + 1} title`}
                            aria-label={`Section ${sectionIndex + 1} title`}
                            data-testid="form-section-title"
                          />
                          <Input
                            value={section.description ?? ''}
                            onChange={(event) =>
                              updateSection(sectionIndex, {
                                description: event.currentTarget.value,
                              })
                            }
                            placeholder="Optional description"
                            aria-label={`Section ${sectionIndex + 1} description`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeSection(sectionIndex)}
                          aria-label={`Remove section ${sectionIndex + 1}`}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {editableFields.map((field) => (
                          <label
                            key={`${sectionIndex}-${field.name}`}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={section.fields.includes(field.name)}
                              onCheckedChange={(checked) =>
                                toggleSectionField(sectionIndex, field.name, checked === true)
                              }
                              data-testid="form-section-field"
                            />
                            {fieldLabel(field.name)}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </FieldGroup>
              )}
            </FieldSet>

            {saveError ? (
              <p className="text-sm text-destructive" data-testid="form-layout-save-error">
                {saveError}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onRequestClose(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={saving || loading || !isDirty}>
          {saving ? 'Saving…' : 'Save form layout'}
        </Button>
      </div>
    </div>
  );
}
