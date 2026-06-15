'use client';

import { PencilIcon } from 'lucide-react';
import {
  editableTypeFields,
  fieldLabel,
  VALUE_TYPE_OPTIONS,
} from '@/lib/registry/type-columns';
import type { TypeField } from '@/lib/schemas/collection';
import { typeDisplayLabel } from '@/lib/registry/type-utils';
import type { TypeDef } from '@/lib/trellis/use-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function valueTypeLabel(valueType?: string): string {
  return (
    VALUE_TYPE_OPTIONS.find((option) => option.value === valueType)?.label ??
    valueType ??
    'string'
  );
}

export function TypeSchemaReadonly({
  type,
  fields,
  includeSystemFields = false,
  onEdit,
  className,
}: {
  type: TypeDef;
  fields: TypeField[];
  includeSystemFields?: boolean;
  onEdit?: () => void;
  className?: string;
}) {
  const rows = includeSystemFields ? fields : editableTypeFields(fields);
  const label = typeDisplayLabel(type);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)} data-testid="type-schema-readonly">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">{label}</h1>
          <p className="text-sm text-muted-foreground">
            Field definitions for this type — read-only preview.
          </p>
        </div>
        {onEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={onEdit}
            data-testid="types-edit-fields"
          >
            <PencilIcon className="size-3.5" />
            Edit fields
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No fields defined yet.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-border text-left text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-2 font-medium">Key</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Required</th>
                <th className="px-4 py-2 font-medium">Options</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((field) => (
                <tr
                  key={field.name}
                  className="border-b border-border-subtle"
                  data-testid="type-field-row"
                >
                  <td className="px-4 py-2.5 font-medium">{fieldLabel(field.name)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {valueTypeLabel(field.valueType)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {field.required ? 'Yes' : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {field.options?.length ? field.options.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
