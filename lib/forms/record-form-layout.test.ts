import { describe, expect, it } from 'vitest';
import {
  resolveFormFieldOrder,
  resolveFormSections,
  shouldUseWizardLayout,
} from './record-form-layout';

describe('record-form-layout', () => {
  it('hides fields listed in hiddenInForm', () => {
    expect(
      resolveFormFieldOrder(['title', 'body', 'status'], {
        hiddenInForm: ['status'],
      }),
    ).toEqual(['title', 'body']);
  });

  it('orders fields via fieldOrder', () => {
    expect(
      resolveFormFieldOrder(['body', 'title', 'status'], {
        fieldOrder: ['status', 'title', 'body'],
      }),
    ).toEqual(['status', 'title', 'body']);
  });

  it('detects wizard layout from multiple sections', () => {
    expect(shouldUseWizardLayout(undefined)).toBe(false);
    expect(shouldUseWizardLayout({ sections: [{ fields: ['title'] }] })).toBe(false);
    expect(
      shouldUseWizardLayout({
        sections: [{ fields: ['title'] }, { fields: ['body'] }],
      }),
    ).toBe(true);
  });

  it('resolves sections and appends unassigned fields', () => {
    expect(
      resolveFormSections(['title', 'body', 'status'], {
        sections: [
          { title: 'Basics', fields: ['title'] },
          { title: 'Details', fields: ['body'] },
        ],
      }),
    ).toEqual([
      { title: 'Basics', fields: ['title'] },
      { title: 'Details', fields: ['body'] },
      { title: 'Other', fields: ['status'] },
    ]);
  });
});
