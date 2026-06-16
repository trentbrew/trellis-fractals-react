'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FormLayout } from '@/lib/forms/record-form-layout';
import { resolveFormSections } from '@/lib/forms/record-form-layout';
import type { TypeField } from '@/lib/schemas/record-fields';
import { validateRecordFieldsByName } from '@/lib/schemas/record-fields';
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

export type RecordFormWizardProps = {
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

export function RecordFormWizard({
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
  idPrefix = 'record-form-wizard',
  formErrorTestId = 'record-form-error',
  onFieldChange,
  onSubmit,
  onCancel,
  footer,
}: RecordFormWizardProps) {
  const sections = useMemo(
    () => resolveFormSections(fields.map((field) => field.name), layout),
    [fields, layout],
  );
  const [step, setStep] = useState(0);
  const [stepFieldErrors, setStepFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setStep(0);
      setStepFieldErrors({});
    }
  }, [open]);

  const currentSection = sections[step];
  const isLastStep = step >= sections.length - 1;
  const mergedFieldErrors = { ...fieldErrors, ...stepFieldErrors };

  function handleFieldChange(fieldName: string, value: unknown) {
    onFieldChange(fieldName, value);
    if (stepFieldErrors[fieldName]) {
      setStepFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }

  function handleBack() {
    setStepFieldErrors({});
    setStep((prev) => Math.max(0, prev - 1));
  }

  function handleNext() {
    if (!currentSection) return;
    const check = validateRecordFieldsByName(fields, currentSection.fields, values);
    if (!check.ok) {
      setStepFieldErrors(check.fieldErrors);
      return;
    }
    setStepFieldErrors({});
    setStep((prev) => Math.min(sections.length - 1, prev + 1));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(88vh,46rem)] max-w-2xl flex-col sm:max-w-2xl"
        data-testid="record-form-wizard"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
          {sections.length > 1 ? (
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {sections.length}
              {currentSection?.title ? ` · ${currentSection.title}` : ''}
            </p>
          ) : null}
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={(event) => void onSubmit(event)}
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <RecordForm
              fields={fields}
              values={values}
              fieldErrors={mergedFieldErrors}
              layout={layout}
              sectionIndex={step}
              mentionSource={mentionSource}
              idPrefix={idPrefix}
              onChange={handleFieldChange}
            />
          </div>
          {formError ? (
            <p className="text-sm text-destructive" data-testid={formErrorTestId}>
              {formError}
            </p>
          ) : null}
          {footer ?? (
            <DialogFooter className="px-0 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <div className="flex gap-2">
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
                {isLastStep ? (
                  <Button type="submit" disabled={submitting || submitDisabled}>
                    {submitLabel}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
