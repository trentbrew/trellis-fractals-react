'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { FormLayout } from '@/lib/forms/record-form-layout';
import type { TypeField } from '@/lib/schemas/record-fields';
import type { MentionSource } from '@/lib/links/trellis-mention';
import { RecordForm } from '@/components/forms/record-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  resolveRecordDialogTransition,
  resolveVantageLayout,
  type VantageMotion,
} from '@/lib/fractal/vantage-motion-types';

export type RecordFormDialogProps = {
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
  /** Shared layout id for card → dialog morph (entity focus axis). */
  layoutId?: string;
  vantageMotion?: VantageMotion;
  onFieldChange: (fieldName: string, value: unknown) => void;
  onSubmit: (event?: React.FormEvent) => void | Promise<void>;
  onCancel?: () => void;
  footer?: ReactNode;
};

export function RecordFormDialog({
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
  idPrefix = 'record-form-dialog',
  formErrorTestId = 'record-form-error',
  layoutId,
  vantageMotion = 'minimal',
  onFieldChange,
  onSubmit,
  onCancel,
  footer,
}: RecordFormDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogTransition = resolveRecordDialogTransition(vantageMotion);
  const reduced = vantageMotion === 'reduced';
  const morph = Boolean(layoutId);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const formBody = (
    <form
      className="flex min-h-0 flex-1 flex-col gap-4"
      onSubmit={(event) => void onSubmit(event)}
      data-testid="record-form-dialog"
    >
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <RecordForm
          fields={fields}
          values={values}
          fieldErrors={fieldErrors}
          layout={layout}
          mentionSource={mentionSource}
          idPrefix={idPrefix}
          className="flex flex-col gap-4"
          onChange={onFieldChange}
        />
      </div>
      {formError ? (
        <p className="text-sm text-destructive" data-testid={formErrorTestId}>
          {formError}
        </p>
      ) : null}
      {footer ?? (
        <DialogFooter className="px-0 sm:flex-row sm:justify-end">
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
        </DialogFooter>
      )}
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!morph}
        className={
          morph
            ? 'flex max-h-[min(88vh,46rem)] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'
            : 'flex max-h-[min(88vh,46rem)] max-w-2xl flex-col sm:max-w-2xl'
        }
        data-testid="record-form-dialog-shell"
      >
        {morph ? (
          <motion.div
            layout={resolveVantageLayout(vantageMotion, { recordMorph: true })}
            layoutId={layoutId}
            transition={dialogTransition}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="border-b border-border px-6 py-4">
              <DialogHeader className="gap-1 text-left">
                <DialogTitle>{title}</DialogTitle>
                {description ? <DialogDescription>{description}</DialogDescription> : null}
              </DialogHeader>
              <button
                ref={closeRef}
                type="button"
                className="sr-only"
                onClick={() => onOpenChange(false)}
              >
                Close
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-6 py-4">{formBody}</div>
          </motion.div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
            {formBody}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
