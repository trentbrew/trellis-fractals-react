'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { FormLayout } from '@/lib/forms/record-form-layout';
import type { TypeField } from '@/lib/schemas/record-fields';
import type { MentionSource } from '@/lib/links/trellis-mention';
import { RecordForm } from '@/components/forms/record-form';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export type RecordFormPageProps = {
  title: string;
  description?: string;
  collectionTitle: string;
  collectionHref: string;
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

export function RecordFormPage({
  title,
  description,
  collectionTitle,
  collectionHref,
  fields,
  values,
  fieldErrors = {},
  formError = null,
  layout,
  submitting = false,
  submitLabel = 'Save',
  submitDisabled = false,
  mentionSource,
  idPrefix = 'record-form-page',
  formErrorTestId = 'record-form-error',
  onFieldChange,
  onSubmit,
  onCancel,
  footer,
}: RecordFormPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8" data-testid="record-form-page">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={collectionHref} />}>
              {collectionTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>

      <form className="flex flex-col gap-6" onSubmit={(event) => void onSubmit(event)}>
        <RecordForm
          fields={fields}
          values={values}
          fieldErrors={fieldErrors}
          layout={layout}
          mentionSource={mentionSource}
          idPrefix={idPrefix}
          onChange={onFieldChange}
        />
        {formError ? (
          <p className="text-sm text-destructive" data-testid={formErrorTestId}>
            {formError}
          </p>
        ) : null}
        {footer ?? (
          <div className="flex justify-end gap-2">
            <Link
              href={collectionHref}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Cancel
            </Link>
            <Button type="submit" disabled={submitting || submitDisabled}>
              {submitLabel}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
