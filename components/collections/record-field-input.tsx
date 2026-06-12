'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { fieldLabel, valueTypeToSpreadsheetKind } from '@/lib/registry/type-columns';
import type { TypeField } from '@/lib/schemas/collection';
import { Input } from '@/components/ui/input';

function dateInputValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function displayValue(value: unknown, kind: string): string {
  if (kind === 'date') return dateInputValue(value);
  if (value === undefined || value === null) return '';
  return String(value);
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
  'data-testid': testId,
}: RecordFieldInputProps) {
  const kind = valueTypeToSpreadsheetKind(field.valueType, field.name);
  const invalid = Boolean(error);

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
        <select
          id={id}
          aria-invalid={invalid}
          data-testid={testId}
          className={cn(
            'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
            invalid && 'border-destructive',
            className,
          )}
          value={value == null ? '' : String(value)}
          onChange={(event) => onChange(event.currentTarget.value || undefined)}
        >
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
    kind === 'number' ? 'number' : kind === 'date' ? 'date' : field.valueType === 'url' ? 'url' : 'text';

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type={inputType}
        step={kind === 'number' ? 'any' : undefined}
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
  onSave: (value: unknown) => void;
  className?: string;
  'data-testid'?: string;
};

export function RecordFieldBlurInput({
  field,
  value,
  onSave,
  className,
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
      <select
        data-testid={testId}
        className={cn(
          'min-w-0 max-w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        value={value == null ? '' : String(value)}
        onChange={(event) => onSave(event.currentTarget.value || undefined)}
      >
        <option value="">—</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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
    kind === 'number' ? 'number' : kind === 'date' ? 'date' : field.valueType === 'url' ? 'url' : 'text';

  return (
    <Input
      type={inputType}
      step={kind === 'number' ? 'any' : undefined}
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
