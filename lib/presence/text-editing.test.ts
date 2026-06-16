import { describe, expect, it } from 'vitest';
import {
  isRemoteCellCaretVisible,
  textDiff,
  utf16ToCodePointIndex,
} from './text-editing';

describe('text-editing', () => {
  it('diffs on code-point boundaries', () => {
    expect(textDiff('hi', 'hiya')).toEqual({
      index: 2,
      removed: 0,
      inserted: 'ya',
    });
  });

  it('maps utf16 caret offsets to code points', () => {
    expect(utf16ToCodePointIndex('ab', 1)).toBe(1);
  });

  it('hides stale remote carets', () => {
    expect(
      isRemoteCellCaretVisible({ caret: 3, caretAt: Date.now() - 3_000 }),
    ).toBe(false);
    expect(isRemoteCellCaretVisible({ caret: 3, caretAt: Date.now() })).toBe(true);
    expect(isRemoteCellCaretVisible({ caret: -1, caretAt: Date.now() })).toBe(false);
  });
});
