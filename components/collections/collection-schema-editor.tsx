'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import {
  collectionRecordTypeId,
  isSelectValueType,
  normalizeSchemaDraftFields,
  validateSchemaDraftFields,
  type TypeField,
} from '@/lib/schemas/collection';
import {
  editableTypeFields,
  fieldLabel,
  VALUE_TYPE_OPTIONS,
  withSystemRecordFields,
} from '@/lib/registry/type-columns';
import { useTypes } from '@/lib/trellis/use-types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type CollectionSchemaFieldsEditorProps = {
  collectionTitle: string;
  collectionSlug: string;
  fields: TypeField[];
  /** When true, opens with a blank field row appended and focused. */
  startWithNewField?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onClose: () => void;
  onRequestClose: (open: boolean) => void;
};

function emptyField(): TypeField {
  return { name: '', valueType: 'string', required: false };
}

function cloneEditableFields(fields: TypeField[]): TypeField[] {
  return editableTypeFields(fields).map((field) => ({
    ...field,
    options: field.options ? [...field.options] : undefined,
  }));
}

function fieldsSnapshot(fields: TypeField[]): string {
  return JSON.stringify(normalizeSchemaDraftFields(fields));
}

export function CollectionSchemaFieldsEditor({
  collectionTitle,
  collectionSlug,
  fields,
  startWithNewField = false,
  onDirtyChange,
  onClose,
  onRequestClose,
}: CollectionSchemaFieldsEditorProps) {
  const { types, loading, createType, updateType } = useTypes();
  const typeId = collectionRecordTypeId(collectionSlug);
  const [draftFields, setDraftFields] = useState<TypeField[]>([]);
  const [baselineSnapshot, setBaselineSnapshot] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<number, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const nextDraft = cloneEditableFields(fields);
    if (startWithNewField) {
      nextDraft.push(emptyField());
    }
    setDraftFields(nextDraft);
    setBaselineSnapshot(fieldsSnapshot(nextDraft));
    setFieldErrors({});
    setFormError(null);
    setSaveError(null);
    setDiscardConfirmOpen(false);
    setInitialized(true);
  }, [fields, startWithNewField]);

  useEffect(() => {
    if (!initialized || !startWithNewField) return;
    const frame = requestAnimationFrame(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-testid="schema-field-key"]');
      inputs[inputs.length - 1]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [initialized, startWithNewField, draftFields.length]);

  const isDirty = useMemo(
    () => initialized && fieldsSnapshot(draftFields) !== baselineSnapshot,
    [initialized, draftFields, baselineSnapshot],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function updateField(index: number, patch: Partial<TypeField>) {
    setDraftFields((prev) =>
      prev.map((field, fieldIndex) => {
        if (fieldIndex !== index) return field;
        const next = { ...field, ...patch };
        if (patch.valueType && !isSelectValueType(patch.valueType)) {
          next.options = undefined;
        } else if (isSelectValueType(next.valueType) && !next.options) {
          next.options = [];
        }
        return next;
      }),
    );
    setFieldErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setFormError(null);
    setSaveError(null);
  }

  function addField() {
    setDraftFields((prev) => [...prev, emptyField()]);
  }

  function removeField(index: number) {
    setDraftFields((prev) => prev.filter((_, fieldIndex) => fieldIndex !== index));
    setFieldErrors((prev) => {
      const next: Record<number, string[]> = {};
      for (const [key, messages] of Object.entries(prev)) {
        const fieldIndex = Number(key);
        if (fieldIndex < index) next[fieldIndex] = messages;
        if (fieldIndex > index) next[fieldIndex - 1] = messages;
      }
      return next;
    });
  }

  function updateOption(fieldIndex: number, optionIndex: number, value: string) {
    setDraftFields((prev) =>
      prev.map((field, index) => {
        if (index !== fieldIndex) return field;
        const options = [...(field.options ?? [])];
        options[optionIndex] = value;
        return { ...field, options };
      }),
    );
    setSaveError(null);
  }

  function addOption(fieldIndex: number) {
    setDraftFields((prev) =>
      prev.map((field, index) =>
        index === fieldIndex
          ? { ...field, options: [...(field.options ?? []), ''] }
          : field,
      ),
    );
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    setDraftFields((prev) =>
      prev.map((field, index) => {
        if (index !== fieldIndex) return field;
        return {
          ...field,
          options: (field.options ?? []).filter((_, idx) => idx !== optionIndex),
        };
      }),
    );
  }

  function requestClose(nextOpen: boolean) {
    if (nextOpen) return;
    if (isDirty && !saving) {
      setDiscardConfirmOpen(true);
      return;
    }
    onRequestClose(false);
  }

  function discardChanges() {
    setDiscardConfirmOpen(false);
    onClose();
  }

  async function handleSave() {
    const validation = validateSchemaDraftFields(draftFields);
    setFieldErrors(validation.fieldErrors);
    setFormError(validation.formError);
    if (!validation.valid) return;

    const cleaned = normalizeSchemaDraftFields(draftFields).filter((field) => field.name.length > 0);

    setSaving(true);
    setSaveError(null);
    try {
      const payload = withSystemRecordFields(cleaned);
      const exists = types.some((type) => type['@id'] === typeId);

      if (exists) {
        await updateType(typeId, { fields: payload });
      } else {
        await createType({
          '@id': typeId,
          label: `${collectionTitle} records`,
          fields: payload,
        });
      }
      setBaselineSnapshot(fieldsSnapshot(draftFields));
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save schema');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="flex min-h-0 flex-1 flex-col"
        role="tabpanel"
        data-testid="collection-schema-editor"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-testid="schema-loading"
            >
              <Loader2Icon className="size-4 animate-spin" />
              Loading schema…
            </div>
          ) : draftFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields yet. Add one below.</p>
          ) : (
            <ul className="space-y-3">
              {draftFields.map((field, index) => {
                const rowErrors = fieldErrors[index] ?? [];
                return (
                  <li
                    key={`${field.name}-${index}`}
                    className="rounded-lg border border-border p-3"
                    data-testid="schema-field-row"
                  >
                    <div className="flex items-start gap-2">
                      <div className="grid min-w-0 flex-1 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Key
                          </label>
                          <Input
                            value={field.name}
                            onChange={(event) =>
                              updateField(index, { name: event.currentTarget.value })
                            }
                            placeholder="fieldKey"
                            aria-label={`Field key ${index + 1}`}
                            aria-invalid={rowErrors.length > 0}
                            data-testid="schema-field-key"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Type
                          </label>
                          <Select
                            value={field.valueType ?? 'string'}
                            onValueChange={(value) =>
                              updateField(index, { valueType: value ?? 'string' })
                            }
                          >
                            <SelectTrigger className="w-full" data-testid="schema-field-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VALUE_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {isSelectValueType(field.valueType) ? (
                          <div className="space-y-2" data-testid="schema-field-options">
                            <span className="text-xs font-medium text-muted-foreground">
                              Options
                            </span>
                            {(field.options ?? []).length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Add at least one option for this select field.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {(field.options ?? []).map((option, optionIndex) => (
                                  <li key={`${index}-option-${optionIndex}`} className="flex gap-2">
                                    <Input
                                      value={option}
                                      onChange={(event) =>
                                        updateOption(index, optionIndex, event.currentTarget.value)
                                      }
                                      placeholder={`Option ${optionIndex + 1}`}
                                      aria-label={`Option ${optionIndex + 1} for ${field.name || `field ${index + 1}`}`}
                                      data-testid="schema-field-option"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeOption(index, optionIndex)}
                                      aria-label={`Remove option ${optionIndex + 1}`}
                                    >
                                      <Trash2Icon className="size-3.5" />
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-fit gap-1.5"
                              onClick={() => addOption(index)}
                              data-testid="schema-add-option"
                            >
                              <PlusIcon className="size-3.5" />
                              Add option
                            </Button>
                          </div>
                        ) : null}
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(event) =>
                              updateField(index, { required: event.currentTarget.checked })
                            }
                            data-testid="schema-field-required"
                          />
                          Required
                          {field.name ? ` (${fieldLabel(field.name)})` : null}
                        </label>
                        {rowErrors.length > 0 ? (
                          <ul className="space-y-1" data-testid="schema-field-error">
                            {rowErrors.map((message) => (
                              <li key={message} className="text-xs text-destructive">
                                {message}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeField(index)}
                        aria-label={`Remove field ${field.name || index + 1}`}
                        disabled={field.name === 'title'}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            onClick={addField}
            disabled={loading}
          >
            <PlusIcon className="size-3.5" />
            Add field
          </Button>

          {formError ? (
            <p className="text-sm text-destructive" data-testid="schema-form-error">
              {formError}
            </p>
          ) : null}

          {saveError ? (
            <p className="text-sm text-destructive" data-testid="schema-save-error">
              {saveError}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-4">
          <Button type="button" variant="outline" onClick={() => requestClose(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading}
          >
            {saving ? 'Saving…' : 'Save schema'}
          </Button>
        </div>
      </div>

      <Dialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <DialogContent showCloseButton={false} data-testid="schema-discard-dialog">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Your schema edits have not been saved. Discard them and close the editor?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDiscardConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="destructive" onClick={discardChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
