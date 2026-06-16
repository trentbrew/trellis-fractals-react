'use client';

import type { ReactNode } from 'react';
import type { FormLayout } from '@/lib/forms/record-form-layout';
import type { TypeField } from '@/lib/schemas/record-fields';
import type { MentionSource } from '@/lib/links/trellis-mention';
import { RecordForm } from '@/components/forms/record-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export type RecordFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: TypeField[];
  values: Record<string, unknown>;
  fieldErrors?: Record<string, string>;
  formError?: string | null;
  layout?: FormLayout;
  submitting?: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  mentionSource?: MentionSource;
  idPrefix?: string;
  formErrorTestId?: string;
  onFieldChange: (fieldName: string, value: unknown) => void;
  onSubmit: (event?: React.FormEvent) => void | Promise<void>;
  onCancel?: () => void;
  footer?: ReactNode;
};

export function RecordFormSheet({
  open,
  onOpenChange,
  title,
  description,
  fields,
  values,
  fieldErrors = {},
  formError = null,
  layout,
  submitting = false,
  submitLabel = 'Save',
  submitDisabled = false,
  mentionSource,
  idPrefix = 'record-form-sheet',
  formErrorTestId = 'record-form-error',
  onFieldChange,
  onSubmit,
  onCancel,
  footer,
}: RecordFormSheetProps) {
  function handleFieldChange(fieldName: string, value: unknown) {
    onFieldChange(fieldName, value);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(event) => void onSubmit(event)}
          data-testid="record-form-sheet"
        >
          <RecordForm
            fields={fields}
            values={values}
            fieldErrors={fieldErrors}
            layout={layout}
            mentionSource={mentionSource}
            idPrefix={idPrefix}
            className="flex flex-col gap-4"
            onChange={handleFieldChange}
          />
          {formError ? (
            <p className="text-sm text-destructive" data-testid={formErrorTestId}>
              {formError}
            </p>
          ) : null}
          {footer ?? (
            <SheetFooter className="px-0 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onCancel?.();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || submitDisabled}>
                {submitLabel}
              </Button>
            </SheetFooter>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
