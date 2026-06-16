/** Viewport clientX/clientY (px); OFFSCREEN (-1) hides the cursor. */
export const OFFSCREEN = -1;

export interface BoardPresence {
  name: string;
  color: string;
  x: number;
  y: number;
  /** Kanban card being edited, dragged, or focused — drives remote highlight rings. */
  cardId?: string | null;
  /** Spreadsheet row id when a table cell is focused. */
  cellRowId?: string | null;
  /** Spreadsheet column key when a table cell is focused. */
  cellKey?: string | null;
  /** Text caret index inside an active spreadsheet cell (code points; -1 = hidden). */
  caret?: number | null;
  /** Epoch ms of last caret move — remote carets expire without fresh moves. */
  caretAt?: number | null;
  /** App route for session-wide nav badges (not page-scoped cursor room). */
  route?: string | null;
  /** Browser tab is hidden (Page Visibility API) — avatars render at reduced opacity. */
  away?: boolean | null;
  [key: string]: unknown;
}

export function peerHasCellFocus(state: BoardPresence): boolean {
  return Boolean(state.cellRowId && state.cellKey);
}
