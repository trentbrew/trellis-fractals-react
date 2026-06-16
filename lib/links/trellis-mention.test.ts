import { describe, expect, it } from 'vitest';
import { htmlToPlainText, parseEntityRef, toEntityRef } from './trellis-mention';

describe('entity ref codec', () => {
  it('round-trips an id through the entity: ref grammar', () => {
    const id = 'TRL-10';
    expect(parseEntityRef(toEntityRef(id))).toBe(id);
  });

  it('round-trips uuid-shaped ids', () => {
    const id = '01890c2e-7b3a-7c1d-9f00-abc123def456';
    expect(parseEntityRef(toEntityRef(id))).toBe(id);
  });

  it('parses a data-trellis-ref attribute value', () => {
    expect(parseEntityRef('entity:abc')).toBe('abc');
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseEntityRef('  entity:abc  ')).toBe('abc');
  });

  it('returns null for non-entity / empty refs', () => {
    expect(parseEntityRef(null)).toBeNull();
    expect(parseEntityRef(undefined)).toBeNull();
    expect(parseEntityRef('')).toBeNull();
    expect(parseEntityRef('https://example.com')).toBeNull();
    expect(parseEntityRef('entity:')).toBeNull();
  });
});

describe('htmlToPlainText', () => {
  it('strips tags and collapses whitespace', () => {
    expect(htmlToPlainText('<p>Hello   <strong>world</strong></p>')).toBe('Hello world');
  });

  it('keeps mention label text without markup', () => {
    const html =
      '<p>see <span data-trellis-ref="entity:TRL-10" data-label="Rich text">@Rich text</span></p>';
    expect(htmlToPlainText(html)).toBe('see @Rich text');
  });

  it('decodes common entities and ignores non-strings', () => {
    expect(htmlToPlainText('a &amp; b &lt;c&gt;')).toBe('a & b <c>');
    expect(htmlToPlainText(undefined)).toBe('');
    expect(htmlToPlainText(42)).toBe('');
  });
});
