'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type FocusSafeFieldOptions = {
  /** Debounce save while typing (e.g. table title = 400ms). Omit for blur-only save. */
  debounceMs?: number;
};

export type FocusSafeFieldHandlers = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

/**
 * Focus-safe inline field: mirrors `remoteValue` while unfocused (so realtime
 * updates from peers don't clobber in-progress edits), and persists via `onSave`
 * on blur — or debounced while typing if `debounceMs` is set. Enter blurs (flushes).
 *
 * React equivalent of `syncTitleField` + `wireTitleField` / `wireDebouncedField`.
 */
export function useFocusSafeField(
  remoteValue: string,
  onSave: (value: string) => void,
  options: FocusSafeFieldOptions = {},
): FocusSafeFieldHandlers {
  const [value, setValue] = useState(remoteValue);
  const focused = useRef(false);
  const lastSaved = useRef(remoteValue);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!focused.current) {
      setValue(remoteValue);
      lastSaved.current = remoteValue;
    }
  }, [remoteValue]);

  const save = useCallback(
    (next: string) => {
      if (next === lastSaved.current) return;
      lastSaved.current = next;
      onSave(next);
    },
    [onSave],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = e.target.value;
      setValue(next);

      if (options.debounceMs) {
        if (timer.current !== undefined) clearTimeout(timer.current);
        timer.current = setTimeout(() => save(next), options.debounceMs);
      }
    },
    [options.debounceMs, save],
  );

  const onFocus = useCallback(() => {
    focused.current = true;
  }, []);

  const onBlur = useCallback(() => {
    focused.current = false;
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
    save(value);
  }, [save, value]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  return { value, onChange, onFocus, onBlur, onKeyDown };
}
