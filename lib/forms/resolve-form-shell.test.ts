import { describe, expect, it } from 'vitest';
import { resolveFormShell } from './resolve-form-shell';

describe('resolveFormShell', () => {
  it('defaults create to sheet', () => {
    expect(resolveFormShell({ intent: 'create', fieldCount: 4 })).toBe('sheet');
  });

  it('defaults edit to dialog', () => {
    expect(resolveFormShell({ intent: 'edit', fieldCount: 4 })).toBe('dialog');
  });

  it('honors type dialogShell for create', () => {
    expect(
      resolveFormShell({
        intent: 'create',
        fieldCount: 4,
        dialogShell: 'dialog',
      }),
    ).toBe('dialog');
  });

  it('uses sheet for edit on narrow viewports', () => {
    expect(
      resolveFormShell({
        intent: 'edit',
        fieldCount: 4,
        viewportWidth: 480,
      }),
    ).toBe('sheet');
  });

  it('auto-selects wizard for multi-section form layout', () => {
    expect(
      resolveFormShell({
        intent: 'create',
        fieldCount: 4,
        formLayout: {
          sections: [{ fields: ['title'] }, { fields: ['body'] }],
        },
      }),
    ).toBe('wizard');
  });

  it('honors dialogShell page override over wizard layout', () => {
    expect(
      resolveFormShell({
        intent: 'create',
        fieldCount: 4,
        dialogShell: 'page',
        formLayout: {
          sections: [{ fields: ['title'] }, { fields: ['body'] }],
        },
      }),
    ).toBe('page');
  });
});
