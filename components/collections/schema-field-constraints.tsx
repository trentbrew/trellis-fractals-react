'use client';

import {
  hasSchemaConstraints,
  isDateValueType,
  isNumberValueType,
  isTextValueType,
  NUMBER_FORMAT_OPTIONS,
  parseConstraintIntInput,
  parseConstraintNumberInput,
} from '@/lib/registry/field-constraints';
import type { TypeField, TypeFieldFormat } from '@/lib/schemas/record-fields';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SchemaFieldConstraintsProps = {
  field: TypeField;
  onChange: (patch: Partial<TypeField>) => void;
};

function ConstraintNumberInput({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  testId?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(event) => onChange(parseConstraintNumberInput(event.currentTarget.value))}
        data-testid={testId}
      />
    </div>
  );
}

function ConstraintIntInput({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  testId?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type="number"
        inputMode="numeric"
        value={value ?? ''}
        onChange={(event) => onChange(parseConstraintIntInput(event.currentTarget.value))}
        data-testid={testId}
      />
    </div>
  );
}

export function SchemaFieldConstraints({ field, onChange }: SchemaFieldConstraintsProps) {
  const valueType = field.valueType ?? 'string';

  if (!hasSchemaConstraints(valueType)) return null;

  return (
    <div
      className="space-y-2 rounded-md border border-dashed border-border p-2"
      data-testid="schema-field-constraints"
    >
      <span className="text-xs font-medium text-muted-foreground">Constraints</span>

      {isTextValueType(valueType) ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <ConstraintIntInput
            label="Min length"
            value={field.minLength}
            testId="schema-field-min-length"
            onChange={(minLength) => onChange({ minLength })}
          />
          <ConstraintIntInput
            label="Max length"
            value={field.maxLength}
            testId="schema-field-max-length"
            onChange={(maxLength) => onChange({ maxLength })}
          />
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Pattern (regex)</label>
            <Input
              value={field.pattern ?? ''}
              onChange={(event) => onChange({ pattern: event.currentTarget.value || undefined })}
              placeholder="^[A-Z]+$"
              data-testid="schema-field-pattern"
            />
          </div>
        </div>
      ) : null}

      {isNumberValueType(valueType) ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <ConstraintNumberInput
            label="Min"
            value={field.min}
            testId="schema-field-min"
            onChange={(min) => onChange({ min })}
          />
          <ConstraintNumberInput
            label="Max"
            value={field.max}
            testId="schema-field-max"
            onChange={(max) => onChange({ max })}
          />
          <ConstraintNumberInput
            label="Step"
            value={field.step}
            testId="schema-field-step"
            onChange={(step) => onChange({ step })}
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Format</label>
            <Select
              value={field.format ?? 'plain'}
              onValueChange={(value) =>
                onChange({
                  format: (value as TypeFieldFormat) ?? 'plain',
                  currency: value === 'currency' ? field.currency ?? 'USD' : undefined,
                })
              }
            >
              <SelectTrigger data-testid="schema-field-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMBER_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field.format === 'currency' ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Currency</label>
              <Input
                value={field.currency ?? 'USD'}
                onChange={(event) => onChange({ currency: event.currentTarget.value || undefined })}
                placeholder="USD"
                data-testid="schema-field-currency"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {isDateValueType(valueType) ? (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={Boolean(field.date?.includeTime)}
            onChange={(event) =>
              onChange({
                date: event.currentTarget.checked ? { includeTime: true } : undefined,
              })
            }
            data-testid="schema-field-include-time"
          />
          Include time
        </label>
      ) : null}
    </div>
  );
}
