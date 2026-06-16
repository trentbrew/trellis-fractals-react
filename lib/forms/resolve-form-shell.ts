import {
  shouldUseWizardLayout,
  type FormLayout,
  type FormShellKind,
} from '@/lib/forms/record-form-layout';

export type FormShellIntent = 'create' | 'edit';

export type ResolveFormShellInput = {
  intent: FormShellIntent;
  fieldCount: number;
  /** Type-level override (kernel `dialogShell` parity). */
  dialogShell?: FormShellKind;
  formLayout?: FormLayout;
  viewportWidth?: number;
};

const CREATE_SHELLS = new Set<FormShellKind>(['sheet', 'dialog', 'page', 'wizard']);
const EDIT_SHELLS = new Set<FormShellKind>(['sheet', 'dialog', 'page', 'wizard']);

/**
 * Picks a form shell from context. Create defaults to sidebar sheet; edit defaults to dialog.
 * Multi-section `formLayout` auto-selects wizard unless `dialogShell` overrides.
 */
export function resolveFormShell(input: ResolveFormShellInput): FormShellKind {
  const { intent, fieldCount, dialogShell, formLayout, viewportWidth } = input;
  const wizardLayout = shouldUseWizardLayout(formLayout);

  if (wizardLayout) {
    if (!dialogShell || dialogShell === 'wizard') return 'wizard';
  }

  if (dialogShell) {
    if (intent === 'create' && CREATE_SHELLS.has(dialogShell)) return dialogShell;
    if (intent === 'edit' && EDIT_SHELLS.has(dialogShell)) return dialogShell;
  }

  if (intent === 'create') {
    if (fieldCount > 16) return 'dialog';
    return 'sheet';
  }

  if (viewportWidth !== undefined && viewportWidth < 640) {
    return 'sheet';
  }

  if (fieldCount > 20) return 'dialog';
  return 'dialog';
}
