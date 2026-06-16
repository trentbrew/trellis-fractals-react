'use client';

import { useMemo } from 'react';
import { fieldLabel } from '@/lib/registry/type-columns';
import {
  resolveFormFieldOrder,
  resolveFormSections,
  type FormLayout,
} from '@/lib/forms/record-form-layout';
import type { TypeField } from '@/lib/schemas/record-fields';
import { RecordFieldInput } from '@/components/collections/record-field-input';
import type { MentionSource } from '@/lib/links/trellis-mention';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { cn } from '@/lib/utils';

export type RecordFormProps = {
  fields: TypeField[];
  values: Record<string, unknown>;
  fieldErrors?: Record<string, string>;
  layout?: FormLayout;
  /** When set, only render this wizard step / section index. */
  sectionIndex?: number;
  onChange: (fieldName: string, value: unknown) => void;
  mentionSource?: MentionSource;
  autoFocusField?: string;
  idPrefix?: string;
  className?: string;
};

function RecordFormField({
  field,
  value,
  error,
  inputId,
  autoFocus,
  mentionSource,
  testId,
  onChange,
}: {
  field: TypeField;
  value: unknown;
  error?: string;
  inputId: string;
  autoFocus?: boolean;
  mentionSource?: MentionSource;
  testId: string;
  onChange: (value: unknown) => void;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>
        {fieldLabel(field.name)}
        {field.required ? ' *' : ''}
      </FieldLabel>
      <RecordFieldInput
        field={field}
        id={inputId}
        value={value}
        error={error}
        autoFocus={autoFocus}
        mentionSource={mentionSource}
        data-testid={testId}
        onChange={onChange}
      />
      {field.helpText ? <FieldDescription>{field.helpText}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

export function RecordForm({
  fields,
  values,
  fieldErrors = {},
  layout,
  sectionIndex,
  onChange,
  mentionSource,
  autoFocusField = 'title',
  idPrefix = 'record-form',
  className,
}: RecordFormProps) {
  const fieldByName = useMemo(
    () => new Map(fields.map((field) => [field.name, field])),
    [fields],
  );

  const sections = useMemo(
    () => resolveFormSections(fields.map((field) => field.name), layout),
    [fields, layout],
  );

  const visibleSections = useMemo(() => {
    if (sectionIndex === undefined) return sections;
    return sections[sectionIndex] ? [sections[sectionIndex]] : [];
  }, [sections, sectionIndex]);

  const columns = layout?.columns ?? 1;

  function renderField(field: TypeField) {
    const inputId = `${idPrefix}-${field.name}`;
    const error = fieldErrors[field.name];
    return (
      <RecordFormField
        key={field.name}
        field={field}
        value={values[field.name]}
        error={error}
        inputId={inputId}
        autoFocus={field.name === autoFocusField}
        mentionSource={mentionSource}
        testId={`${idPrefix}-${field.name}`}
        onChange={(value) => onChange(field.name, value)}
      />
    );
  }

  if (visibleSections.length === 0) {
    const order = resolveFormFieldOrder(
      fields.map((field) => field.name),
      layout,
    );
    return (
      <FieldGroup
        className={cn(className, columns === 2 && 'grid grid-cols-1 gap-5 md:grid-cols-2')}
        data-testid="record-form"
      >
        {order
          .map((name) => fieldByName.get(name))
          .filter((field): field is TypeField => Boolean(field))
          .map(renderField)}
      </FieldGroup>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} data-testid="record-form">
      {visibleSections.map((section, index) => (
        <FieldSet key={section.title ?? `section-${index}`}>
          {section.title ? <FieldLegend>{section.title}</FieldLegend> : null}
          {section.description ? <FieldDescription>{section.description}</FieldDescription> : null}
          <FieldGroup
            className={cn(columns === 2 && 'grid grid-cols-1 gap-5 md:grid-cols-2')}
          >
            {section.fields
              .map((name) => fieldByName.get(name))
              .filter((field): field is TypeField => Boolean(field))
              .map(renderField)}
          </FieldGroup>
        </FieldSet>
      ))}
    </div>
  );
}
