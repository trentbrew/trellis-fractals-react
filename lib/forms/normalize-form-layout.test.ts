import { describe, expect, it } from 'vitest';
import { normalizeFormLayout } from './record-form-layout';

describe('normalizeFormLayout', () => {
  it('filters unknown field names', () => {
    expect(
      normalizeFormLayout(
        {
          hiddenInForm: ['title', 'missing'],
          sections: [{ title: 'Basics', fields: ['title', 'ghost'] }],
        },
        ['title', 'body'],
      ),
    ).toEqual({
      hiddenInForm: ['title'],
      sections: [{ title: 'Basics', fields: ['title'] }],
    });
  });

  it('returns undefined for empty layout', () => {
    expect(normalizeFormLayout({}, ['title'])).toBeUndefined();
  });
});
