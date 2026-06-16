'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import {
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
import { mergeTypeFieldPatch } from '@/lib/registry/field-constraints';
import { SchemaFieldConstraints } from '@/components/collections/schema-field-constraints';
import { useTypes } from '@/lib/trellis/use-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type TypeFieldsEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeId: string;
  label: string;
  fields: TypeField[];
  includeSystemFields?: boolean;
};

function emptyField(): TypeField {
  return { name: '', valueType: 'string', required: false };
}

function cloneEditableFields(fields: TypeField[]): TypeField[] {
  return editableTypeFields(fields).map((field) => ({
    ...field,
    options: field.options ? [...field.options] : undefined,
    date: field.date ? { ...field.date } : undefined,
  }));
}

function fieldsSnapshot(fields: TypeField[]): string {
  return JSON.stringify(normalizeSchemaDraftFields(fields));
}

export function TypeFieldsEditor({
  open,
  onOpenChange,
  typeId,
  label,
  fields,
  includeSystemFields = false,
}: TypeFieldsEditorProps) {
  const { types, loading, createType, updateType } = useTypes();
  const exists = useMemo(
    () => types.some((type) => type['@id'] === typeId),
    [types, typeId],
  );
  const [draftFields, setDraftFields] = useState<TypeField[]>([]);
  const [baselineSnapshot, setBaselineSnapshot] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<number, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const nextDraft = cloneEditableFields(fields);
    setDraftFields(nextDraft.length > 0 ? nextDraft : [{ name: 'title', valueType: 'title', required: true }]);
    setBaselineSnapshot(fieldsSnapshot(nextDraft));
    setFieldErrors({});
    setFormError(null);
    setSaveError(null);
  }, [open, fields]);

  const isDirty = useMemo(
    () => open && fieldsSnapshot(draftFields) !== baselineSnapshot,
    [open, draftFields, baselineSnapshot],
  );

  function updateField(index: number, patch: Partial<TypeField>) {
    setDraftFields((prev) =>
      prev.map((field, i) => {
        if (i !== index) return field;
        const next = mergeTypeFieldPatch(field, patch);
        if (isSelectValueType(next.valueType) && !next.options) {
          next.options = [];
        }
        return next;
      }),
    );
  }

  function addField() {
    setDraftFields((prev) => [...prev, emptyField()]);
  }

  function removeField(index: number) {
    setDraftFields((prev) => prev.filter((_, i) => i !== index));
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

  function updateOption(fieldIndex: number, optionIndex: number, value: string) {
    setDraftFields((prev) =>
      prev.map((field, index) => {
        if (index !== fieldIndex) return field;
        const options = [...(field.options ?? [])];
        options[optionIndex] = value;
        return { ...field, options };
      }),
    );
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    setDraftFields((prev) =>
      prev.map((field, index) => {
        if (index !== fieldIndex) return field;
        return { ...field, options: (field.options ?? []).filter((_, i) => i !== optionIndex) };
      }),
    );
  }

  async function handleSave() {
    const validation = validateSchemaDraftFields(draftFields);
    setFieldErrors(validation.fieldErrors);
    setFormError(validation.formError);
    if (!validation.valid) return;

    const cleaned = normalizeSchemaDraftFields(draftFields).filter((field) => field.name.length > 0);
    const payload = includeSystemFields ? withSystemRecordFields(cleaned) : cleaned;

    setSaving(true);
    setSaveError(null);
    try {
      if (exists) {
        await updateType(typeId, { fields: payload });
      } else {
        await createType({
          '@id': typeId,
          label,
          fields: payload,
        });
      }
      setBaselineSnapshot(fieldsSnapshot(draftFields));
      onOpenChange(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save fields');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg"
        data-testid="type-fields-editor"
      >
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
          <SheetDescription>Edit field definitions for this type.</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <ul className="space-y-3">
              {draftFields.map((field, index) => {
                const rowErrors = fieldErrors[index] ?? [];
                return (
                  <li
                    key={`${field.name}-${index}`}
                    className="rounded-lg border border-border p-3"
                    data-testid="type-field-row"
                  >
                    <div className="flex items-start gap-2">
                      <div className="grid min-w-0 flex-1 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Key</label>
                          <Input
                            value={field.name}
                            onChange={(event) =>
                              updateField(index, { name: event.currentTarget.value })
                            }
                            placeholder="fieldKey"
                            aria-invalid={rowErrors.length > 0}
                            data-testid="type-field-key"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Type</label>
                          <Select
                            value={field.valueType ?? 'string'}
                            onValueChange={(value) =>
                              updateField(index, { valueType: value ?? 'string' })
                            }
                          >
                            <SelectTrigger className="w-full">
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
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground">Options</span>
                            <ul className="space-y-2">
                              {(field.options ?? []).map((option, optionIndex) => (
                                <li key={`${index}-option-${optionIndex}`} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(event) =>
                                      updateOption(index, optionIndex, event.currentTarget.value)
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => removeOption(index, optionIndex)}
                                  >
                                    <Trash2Icon className="size-3.5" />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(index)}
                            >
                              <PlusIcon className="size-3.5" />
                              Add option
                            </Button>
                          </div>
                        ) : null}
                        <SchemaFieldConstraints
                          field={field}
                          onChange={(patch) => updateField(index, patch)}
                        />
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(event) =>
                              updateField(index, { required: event.currentTarget.checked })
                            }
                          />
                          Required
                          {field.name ? ` (${fieldLabel(field.name)})` : null}
                        </label>
                        {rowErrors.map((message) => (
                          <p key={message} className="text-xs text-destructive">
                            {message}
                          </p>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={field.name === 'title'}
                        onClick={() => removeField(index)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Button type="button" variant="outline" size="sm" className="w-fit gap-1.5" onClick={addField}>
            <PlusIcon className="size-3.5" />
            Add field
          </Button>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
        </div>

        <SheetFooter className="border-t border-border px-4 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || loading || !isDirty}>
            {saving ? 'Saving…' : 'Save fields'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
