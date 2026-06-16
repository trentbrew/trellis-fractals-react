'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { fieldLabel, valueTypeToSpreadsheetKind } from '@/lib/registry/type-columns';
import type { TypeField } from '@/lib/schemas/collection';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  SELECT_EMPTY_VALUE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorFieldControl, IconFieldControl } from '@/components/collections/record-field-special';
import { RichTextField } from '@/components/collections/rich-text-field';
import type { MentionSource } from '@/lib/links/trellis-mention';
import { htmlToPlainText } from '@/lib/links/trellis-mention';
import { recordDateInputValue } from '@/lib/record-field-utils';

function displayValue(value: unknown, kind: string): string {
  if (kind === 'date') return recordDateInputValue(value);
  if (value === undefined || value === null) return '';
  if (kind === 'longtext') return htmlToPlainText(value);
  return String(value);
}

function OptionSelect({
  value,
  onChange,
  options,
  id,
  invalid,
  className,
  testId,
  compact = false,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  options: string[];
  id?: string;
  invalid?: boolean;
  className?: string;
  testId?: string;
  compact?: boolean;
}) {
  return (
    <Select
      value={value == null ? SELECT_EMPTY_VALUE : String(value)}
      onValueChange={(next) => onChange(next === SELECT_EMPTY_VALUE ? undefined : next)}
    >
      <SelectTrigger
        id={id}
        size={compact ? 'sm' : 'default'}
        aria-invalid={invalid}
        data-testid={testId}
        className={cn('w-full', invalid && 'border-destructive', className)}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent position={compact ? 'popper' : 'item-aligned'}>
        <SelectItem value={SELECT_EMPTY_VALUE}>—</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type RecordFieldInputProps = {
  field: TypeField;
  value: unknown;
  onChange: (value: unknown) => void;
  onCommit?: () => void;
  error?: string;
  id?: string;
  className?: string;
  autoFocus?: boolean;
  presenceKey?: string;
  mentionSource?: MentionSource;
  'data-testid'?: string;
};

export function RecordFieldInput({
  field,
  value,
  onChange,
  onCommit,
  error,
  id,
  className,
  autoFocus,
  presenceKey,
  mentionSource,
  'data-testid': testId,
}: RecordFieldInputProps) {
  const kind = valueTypeToSpreadsheetKind(field.valueType, field.name);
  const invalid = Boolean(error);

  if (field.valueType === 'rich_text') {
    return (
      <div className="space-y-1">
        <RichTextField
          value={value}
          autoFocus={autoFocus}
          className={className}
          presenceKey={presenceKey}
          mentionSource={mentionSource}
          data-testid={testId}
          onSave={(html) => {
            onChange(html);
            onCommit?.();
          }}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (kind === 'boolean') {
    const checked = value === true;
    return (
      <div className="space-y-1">
        <button
          type="button"
          role="switch"
          id={id}
          aria-checked={checked}
          aria-invalid={invalid}
          aria-label={fieldLabel(field.name)}
          data-testid={testId}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-muted ring-1 ring-inset ring-border',
            className,
          )}
          onClick={() => onChange(!checked)}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
              checked ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (kind === 'select') {
    return (
      <div className="space-y-1">
        <OptionSelect
          id={id}
          invalid={invalid}
          testId={testId}
          className={className}
          value={value}
          options={field.options ?? []}
          onChange={onChange}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (kind === 'date') {
    if (field.date?.includeTime) {
      const text = recordDateInputValue(value);
      const datetimeValue =
        text && text.includes('T')
          ? text.slice(0, 16)
          : text
            ? `${text}T00:00`
            : '';
      return (
        <div className="space-y-1">
          <Input
            id={id}
            type="datetime-local"
            aria-invalid={invalid}
            data-testid={testId}
            autoFocus={autoFocus}
            className={cn(invalid && 'border-destructive', className)}
            value={datetimeValue}
            onChange={(event) => onChange(event.currentTarget.value || undefined)}
            onBlur={() => onCommit?.()}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <DatePicker
          id={id}
          data-testid={testId}
          value={value}
          className={cn(invalid && 'ring-1 ring-destructive', className)}
          onChange={(next) => {
            onChange(next);
            onCommit?.();
          }}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (kind === 'color') {
    return (
      <div className="space-y-1">
        <ColorFieldControl
          data-testid={testId}
          value={value}
          className={cn(invalid && 'ring-1 ring-destructive', className)}
          onChange={(next) => {
            onChange(next);
            onCommit?.();
          }}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (kind === 'icon') {
    return (
      <div className="space-y-1">
        <IconFieldControl
          data-testid={testId}
          value={value}
          className={cn(invalid && 'ring-1 ring-destructive', className)}
          onChange={(next) => {
            onChange(next);
            onCommit?.();
          }}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (kind === 'longtext') {
    return (
      <div className="space-y-1">
        <textarea
          id={id}
          aria-invalid={invalid}
          data-testid={testId}
          autoFocus={autoFocus}
          maxLength={field.maxLength}
          className={cn(
            'min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
            invalid && 'border-destructive',
            className,
          )}
          value={displayValue(value, kind)}
          onChange={(event) => onChange(event.currentTarget.value)}
          onBlur={() => onCommit?.()}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  const inputType =
    kind === 'number'
      ? 'number'
      : field.valueType === 'email'
        ? 'email'
        : field.valueType === 'phone_number'
          ? 'tel'
          : field.valueType === 'url'
            ? 'url'
            : 'text';

  const numberStep =
    kind === 'number'
      ? field.step ?? (field.format === 'currency' ? 0.01 : field.format === 'percent' ? 1 : 'any')
      : undefined;

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type={inputType}
        step={numberStep}
        min={kind === 'number' ? field.min : undefined}
        max={kind === 'number' ? field.max : undefined}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        aria-invalid={invalid}
        data-testid={testId}
        autoFocus={autoFocus}
        className={cn(invalid && 'border-destructive', className)}
        value={displayValue(value, kind)}
        onChange={(event) => onChange(event.currentTarget.value)}
        onBlur={() => onCommit?.()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

type RecordFieldBlurInputProps = {
  field: TypeField;
  value: unknown;
  onSave: (value: unknown) => void | Promise<void>;
  className?: string;
  presenceKey?: string;
  mentionSource?: MentionSource;
  'data-testid'?: string;
};

export function RecordFieldBlurInput({
  field,
  value,
  onSave,
  className,
  presenceKey,
  mentionSource,
  'data-testid': testId,
}: RecordFieldBlurInputProps) {
  const kind = valueTypeToSpreadsheetKind(field.valueType, field.name);
  const remote = kind === 'boolean' ? value === true : displayValue(value, kind);
  const [draft, setDraft] = useState(() => (typeof remote === 'boolean' ? remote : String(remote)));
  const focused = useRef(false);
  const lastSaved = useRef<string | boolean>(draft);

  useEffect(() => {
    if (focused.current) return;
    const next = kind === 'boolean' ? value === true : displayValue(value, kind);
    setDraft(next);
    lastSaved.current = next;
  }, [value, kind]);

  const commit = useCallback(
    (next: string | boolean) => {
      if (next === lastSaved.current) return;
      lastSaved.current = next;
      onSave(next);
    },
    [onSave],
  );

  if (field.valueType === 'rich_text') {
    return (
      <RichTextField
        value={value}
        className={className}
        presenceKey={presenceKey}
        mentionSource={mentionSource}
        data-testid={testId}
        onSave={(html) => onSave(html)}
      />
    );
  }

  if (kind === 'boolean') {
    const checked = value === true;
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={fieldLabel(field.name)}
        data-testid={testId}
        className={cn(
          'relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted ring-1 ring-inset ring-border',
          className,
        )}
        onClick={() => onSave(!checked)}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-background shadow-sm transition-transform',
            checked ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </button>
    );
  }

  if (kind === 'select') {
    return (
      <OptionSelect
        testId={testId}
        className={className}
        value={value}
        options={field.options ?? []}
        compact
        onChange={(next) => onSave(next)}
      />
    );
  }

  if (kind === 'date') {
    return (
      <DatePicker
        data-testid={testId}
        value={value}
        compact
        className={className}
        onChange={(next) => onSave(next)}
      />
    );
  }

  if (kind === 'color') {
    return (
      <ColorFieldControl
        data-testid={testId}
        value={value}
        compact
        className={className}
        onChange={(next) => onSave(next)}
      />
    );
  }

  if (kind === 'icon') {
    return (
      <IconFieldControl
        data-testid={testId}
        value={value}
        compact
        className={className}
        onChange={(next) => onSave(next)}
      />
    );
  }

  if (kind === 'longtext') {
    return (
      <textarea
        data-testid={testId}
        className={cn(
          'min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        value={typeof draft === 'string' ? draft : ''}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          commit(draft);
        }}
      />
    );
  }

  const inputType =
    kind === 'number'
      ? 'number'
      : field.valueType === 'email'
        ? 'email'
        : field.valueType === 'phone_number'
          ? 'tel'
          : field.valueType === 'url'
            ? 'url'
            : 'text';

  return (
    <Input
      type={inputType}
      step={
        kind === 'number'
          ? field.step ?? (field.format === 'currency' ? 0.01 : 'any')
          : undefined
      }
      min={kind === 'number' ? field.min : undefined}
      max={kind === 'number' ? field.max : undefined}
      maxLength={field.maxLength}
      data-testid={testId}
      className={className}
      value={typeof draft === 'string' ? draft : ''}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        commit(draft);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
