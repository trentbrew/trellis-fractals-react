/** Caret sync helpers — aligned with trellis-node/examples/universal-presence/shared/text.ts */

export const CARET_STALE_MS = 2_500;

export function codePointLen(str: string): number {
  return [...str].length;
}

export function utf16ToCodePointIndex(str: string, utf16Offset: number): number {
  return [...str.slice(0, utf16Offset)].length;
}

export function codePointToUtf16Offset(str: string, cpIndex: number): number {
  let cp = 0;
  let utf16 = 0;
  for (const ch of str) {
    if (cp === cpIndex) return utf16;
    utf16 += ch.length;
    cp += 1;
  }
  return utf16;
}

export function textDiff(
  oldStr: string,
  newStr: string,
): { index: number; removed: number; inserted: string } {
  const old = [...oldStr];
  const neu = [...newStr];
  let start = 0;
  const min = Math.min(old.length, neu.length);
  while (start < min && old[start] === neu[start]) start++;
  let endOld = old.length;
  let endNew = neu.length;
  while (endOld > start && endNew > start && old[endOld - 1] === neu[endNew - 1]) {
    endOld--;
    endNew--;
  }
  return {
    index: start,
    removed: endOld - start,
    inserted: neu.slice(start, endNew).join(''),
  };
}

let caretSyncGen = 0;

export function scheduleCaretSync(fn: () => void): void {
  const gen = ++caretSyncGen;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (gen !== caretSyncGen) return;
      fn();
    }),
  );
}

export function cancelCaretSync(): void {
  caretSyncGen += 1;
}

export function isTextFieldActive(field: HTMLInputElement | HTMLTextAreaElement): boolean {
  return (
    document.visibilityState === 'visible' &&
    document.hasFocus() &&
    document.activeElement === field
  );
}

export function isRemoteCellCaretVisible(
  holder: { caret?: number | null; caretAt?: number | null },
  now = Date.now(),
): boolean {
  const caret = holder.caret;
  if (caret == null || caret < 0) return false;
  const at = holder.caretAt;
  if (at == null || at <= 0) return false;
  return now - at < CARET_STALE_MS;
}

/** Browsers vertically center single-line input text in a tall box; mirror div does not. */
function singleLineVerticalCenterOffset(field: HTMLInputElement | HTMLTextAreaElement): number {
  if (field instanceof HTMLTextAreaElement) return 0;
  const cs = getComputedStyle(field);
  const padTop = parseFloat(cs.paddingTop) || 0;
  const padBottom = parseFloat(cs.paddingBottom) || 0;
  const fontSize = parseFloat(cs.fontSize) || 12;
  const lineHeight = parseFloat(cs.lineHeight);
  const lineH = Number.isFinite(lineHeight) ? lineHeight : fontSize * 1.2;
  const innerHeight = field.clientHeight - padTop - padBottom;
  if (innerHeight <= lineH) return 0;
  return (innerHeight - lineH) / 2;
}

export function measureCaretInField(
  field: HTMLInputElement | HTMLTextAreaElement,
  codePointIndex: number,
): { top: number; left: number } | null {
  if (codePointIndex < 0) return null;
  const text = field.value;
  const cpLen = codePointLen(text);
  if (codePointIndex > cpLen) return null;

  const mirror = document.createElement('div');
  const cs = getComputedStyle(field);
  const props = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'textTransform',
    'wordSpacing',
    'textIndent',
    'whiteSpace',
    'wordWrap',
    'overflowWrap',
    'lineHeight',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'boxSizing',
  ] as const;

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = field instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'hidden';
  mirror.style.width = `${field.clientWidth}px`;
  for (const prop of props) {
    mirror.style[prop] = cs[prop];
  }

  const utf16 = codePointToUtf16Offset(text, codePointIndex);
  const before = text.slice(0, utf16);
  const after = text.slice(utf16);

  mirror.textContent = '';
  mirror.append(before);
  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.append(marker);
  if (after.length > 0) mirror.append(after);

  document.body.appendChild(mirror);
  const top = marker.offsetTop - field.scrollTop + singleLineVerticalCenterOffset(field);
  const left = marker.offsetLeft - field.scrollLeft;
  document.body.removeChild(mirror);

  return { top, left };
}

export function applyRemoteFieldValue(
  field: HTMLInputElement | HTMLTextAreaElement,
  next: string,
  last: string,
): void {
  const current = field.value;
  if (next === current) return;

  const sel = field.selectionStart ?? 0;
  const selEnd = field.selectionEnd ?? sel;
  const cpCaret = utf16ToCodePointIndex(current, sel);
  const cpEnd = utf16ToCodePointIndex(current, selEnd);

  field.value = next;

  const d = textDiff(last, next);
  let newCp = cpCaret;
  if (cpCaret >= d.index) {
    if (cpCaret < d.index + d.removed) {
      newCp = d.index + codePointLen(d.inserted);
    } else {
      newCp = cpCaret - d.removed + codePointLen(d.inserted);
    }
  }
  let newCpEnd = cpEnd;
  if (cpEnd >= d.index) {
    if (cpEnd < d.index + d.removed) {
      newCpEnd = d.index + codePointLen(d.inserted);
    } else {
      newCpEnd = cpEnd - d.removed + codePointLen(d.inserted);
    }
  }

  const start = codePointToUtf16Offset(next, newCp);
  const end = codePointToUtf16Offset(next, newCpEnd);
  try {
    field.setSelectionRange(start, end);
  } catch {
    /* ignore */
  }
}
