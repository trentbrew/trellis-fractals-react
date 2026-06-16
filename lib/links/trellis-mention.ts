/**
 * Trellis mention — graph-native entity mentions for the rich-text editor.
 *
 * Editor substrate is commodity (Tiptap/ProseMirror); the semantic contract is
 * ours: a mention node serializes to `<span data-trellis-ref="entity:<id>">`
 * using the canonical `trellis/links` ref grammar. ADR 0013 (TRL-10 P0).
 *
 * The ref codec (`toEntityRef` / `parseEntityRef`) is pure and DOM-free so the
 * P0 round-trip contract can be unit-tested without an editor instance.
 */
import Mention from '@tiptap/extension-mention';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';

/** A pickable entity for the `@`-mention popup. */
export type MentionCandidate = {
  id: string;
  label: string;
  /** Optional entity kind (record, collection, …) — shown as a hint. */
  type?: string;
};

/** Provides candidates for a given query fragment (after the `@`). */
export type MentionSource = (
  query: string,
) => MentionCandidate[] | Promise<MentionCandidate[]>;

const ENTITY_REF = /^entity:(.+)$/;

/** `id` → canonical `entity:<id>` ref (the `trellis/links` grammar). */
export function toEntityRef(id: string): string {
  return `entity:${id}`;
}

/** `entity:<id>` (or any `data-trellis-ref` value) → bare entity id, or null. */
export function parseEntityRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const match = ENTITY_REF.exec(ref.trim());
  return match ? match[1].trim() || null : null;
}

/** Build the mention node's DOM attributes, omitting null/empty values. */
function mentionAttrs(id: unknown, label: unknown): Record<string, string> {
  const attrs: Record<string, string> = {
    class: 'trellis-mention',
    'data-type': 'mention',
  };
  if (typeof id === 'string' && id) attrs['data-trellis-ref'] = toEntityRef(id);
  if (typeof label === 'string' && label) attrs['data-label'] = label;
  return attrs;
}

/**
 * Configured Tiptap mention extension bound to a candidate `source`.
 *
 * - serializes to `<span data-trellis-ref="entity:<id>" data-label="…">@label</span>`
 * - parses any `span[data-trellis-ref]` back into a mention node (lossless round-trip)
 * - inserts via Mention's default command on selection (no graph writes — P0)
 */
export function buildTrellisMention(source?: MentionSource) {
  return Mention.extend({
    name: 'mention',
    parseHTML() {
      return [{ tag: 'span[data-trellis-ref]' }];
    },
    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (el) => parseEntityRef(el.getAttribute('data-trellis-ref')),
        },
        label: {
          default: null,
          parseHTML: (el) =>
            el.getAttribute('data-label') ??
            el.textContent?.replace(/^@/, '') ??
            null,
        },
      };
    },
  }).configure({
    deleteTriggerWithBackspace: true,
    renderHTML({ node }) {
      return [
        'span',
        mentionAttrs(node.attrs.id, node.attrs.label),
        `@${node.attrs.label ?? node.attrs.id ?? ''}`,
      ];
    },
    renderText({ node }) {
      return `@${node.attrs.label ?? node.attrs.id ?? ''}`;
    },
    suggestion: createMentionSuggestion(source),
  });
}

/**
 * Minimal dependency-free suggestion popup: an absolutely-positioned list with
 * keyboard (↑/↓/Enter/Esc) and click selection. Kept vanilla to avoid pulling a
 * popover lib into the editor substrate.
 */
function createMentionSuggestion(
  source?: MentionSource,
): Omit<SuggestionOptions<MentionCandidate>, 'editor'> {
  return {
    char: '@',
    allowSpaces: false,
    items: async ({ query }) => {
      if (!source) return [];
      const items = await source(query);
      return items.slice(0, 8);
    },
    render: () => {
      let dom: HTMLDivElement | null = null;
      let items: MentionCandidate[] = [];
      let selected = 0;
      let command: SuggestionProps<MentionCandidate>['command'] | null = null;

      function destroy() {
        dom?.remove();
        dom = null;
      }

      function paint() {
        if (!dom) return;
        dom.replaceChildren();
        if (items.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'trellis-mention-popup__empty';
          empty.textContent = 'No matches';
          dom.append(empty);
          return;
        }
        items.forEach((item, index) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'trellis-mention-popup__item';
          row.setAttribute('role', 'option');
          row.setAttribute('data-testid', 'mention-option');
          if (index === selected) row.dataset.active = 'true';
          row.textContent = item.label;
          if (item.type) {
            const hint = document.createElement('span');
            hint.className = 'trellis-mention-popup__hint';
            hint.textContent = item.type;
            row.append(hint);
          }
          row.addEventListener('mousedown', (event) => {
            event.preventDefault();
            select(index);
          });
          dom!.append(row);
        });
      }

      function select(index: number) {
        const item = items[index];
        if (item && command) command({ id: item.id, label: item.label });
      }

      function position(props: SuggestionProps<MentionCandidate>) {
        if (!dom) return;
        const rect = props.clientRect?.();
        if (!rect) return;
        dom.style.left = `${rect.left}px`;
        dom.style.top = `${rect.bottom + 4}px`;
      }

      return {
        onStart(props) {
          items = props.items;
          selected = 0;
          command = props.command;
          dom = document.createElement('div');
          dom.className = 'trellis-mention-popup';
          dom.setAttribute('data-testid', 'mention-popup');
          document.body.append(dom);
          paint();
          position(props);
        },
        onUpdate(props) {
          items = props.items;
          command = props.command;
          if (selected >= items.length) selected = 0;
          paint();
          position(props);
        },
        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            destroy();
            return true;
          }
          if (items.length === 0) return false;
          if (props.event.key === 'ArrowDown') {
            selected = (selected + 1) % items.length;
            paint();
            return true;
          }
          if (props.event.key === 'ArrowUp') {
            selected = (selected - 1 + items.length) % items.length;
            paint();
            return true;
          }
          if (props.event.key === 'Enter') {
            select(selected);
            return true;
          }
          return false;
        },
        onExit() {
          destroy();
        },
      };
    },
  };
}

/**
 * Strip HTML to plain text for non-editor preview surfaces (cards, table cells)
 * so rich-text bodies don't leak `<p>`/mention markup. DOM-free (regex) so it is
 * safe in SSR and unit tests.
 */
export function htmlToPlainText(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Wrap plain spreadsheet edits back into minimal rich-text HTML. */
export function plainTextToRichHtml(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const escaped = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${escaped}</p>`;
}
