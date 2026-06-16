'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initialsForName } from '@/lib/presence/identity';
import { useBoardPresence } from '@/lib/presence/context';
import {
  buildTrellisMention,
  type MentionSource,
} from '@/lib/links/trellis-mention';

/**
 * Rich-text field editor for `rich_text` graph fields (ADR 0013, TRL-10 P0).
 *
 * - Tiptap/ProseMirror substrate (commodity); HTML + `data-trellis-ref` wire format.
 * - Local-first save UX: editor state and save lifecycle are independent of graph
 *   ACK latency (mutations are server-confirmed, not optimistic).
 * - Record-level presence reuses `joinPresence` via the board presence context —
 *   no new infra (a record is treated as a "card").
 */

type SaveState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 600;
const SAVED_FLASH_MS = 1500;

type RichTextFieldProps = {
  value: unknown;
  /** Persist serialized HTML. Returning a promise drives the save-state UI. */
  onSave: (html: string) => void | Promise<void>;
  className?: string;
  editable?: boolean;
  autoFocus?: boolean;
  /** Record/document id — enables "who is editing this" presence when set. */
  presenceKey?: string;
  /** Candidate provider for `@`-mentions. */
  mentionSource?: MentionSource;
  'data-testid'?: string;
};

const SAVE_LABEL: Record<SaveState, string> = {
  idle: '',
  editing: 'Editing…',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
};

export function RichTextField({
  value,
  onSave,
  className,
  editable = true,
  autoFocus,
  presenceKey,
  mentionSource,
  'data-testid': testId,
}: RichTextFieldProps) {
  const initialValue = typeof value === 'string' ? value : '';

  // Decouple editor identity from changing prop identities: read latest values
  // from refs so the editor is created exactly once.
  const sourceRef = useRef<MentionSource | undefined>(mentionSource);
  sourceRef.current = mentionSource;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const focusedRef = useRef(false);
  const lastSavedRef = useRef(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presence = useBoardPresence();

  const extensions = useMemo(
    () => [
      StarterKit,
      buildTrellisMention((query) => sourceRef.current?.(query) ?? []),
    ],
    [],
  );

  const commit = useCallback(async (html: string) => {
    if (html === lastSavedRef.current) {
      setSaveState('idle');
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState('saving');
    try {
      await onSaveRef.current(html);
      lastSavedRef.current = html;
      setSaveState('saved');
      if (flashRef.current) clearTimeout(flashRef.current);
      flashRef.current = setTimeout(() => setSaveState('idle'), SAVED_FLASH_MS);
    } catch {
      setSaveState('error');
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions,
    content: initialValue,
    editorProps: {
      attributes: {
        class: cn(
          'trellis-richtext min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      setSaveState('editing');
      const html = ed.isEmpty ? '' : ed.getHTML();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void commit(html), SAVE_DEBOUNCE_MS);
    },
    onFocus: () => {
      focusedRef.current = true;
      if (presenceKey) presence?.setCardFocus(presenceKey);
    },
    onBlur: ({ editor: ed }) => {
      focusedRef.current = false;
      if (presenceKey) presence?.setCardFocus(null);
      const html = ed.isEmpty ? '' : ed.getHTML();
      void commit(html);
    },
  });

  // Push remote changes into the editor only while the user is not editing.
  useEffect(() => {
    if (!editor || focusedRef.current) return;
    const next = typeof value === 'string' ? value : '';
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
      lastSavedRef.current = next;
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (autoFocus && editor) editor.commands.focus('end');
  }, [autoFocus, editor]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
    },
    [],
  );

  const editingPeers = useMemo(() => {
    if (!presenceKey || !presence) return [];
    return (presence.focusByCardId.get(presenceKey) ?? []).filter((p) => !p.self);
  }, [presence, presenceKey]);

  return (
    <div className={cn('space-y-1', className)} data-testid={testId}>
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs text-muted-foreground"
          data-testid={testId ? `${testId}-status` : undefined}
          data-save-state={saveState}
        >
          {SAVE_LABEL[saveState]}
        </span>
        {editingPeers.length > 0 ? (
          <div className="flex items-center gap-1" data-testid="record-presence">
            {editingPeers.slice(0, 4).map((peer) => (
              <Avatar key={peer.id} size="sm">
                <AvatarFallback
                  className="text-[10px] font-semibold text-white"
                  style={{ backgroundColor: peer.state.color }}
                >
                  {initialsForName(peer.state.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
