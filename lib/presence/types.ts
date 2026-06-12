/** Normalized pointer over the board surface; OFFSCREEN hides the cursor. */
export const OFFSCREEN = -1;

export interface BoardPresence {
  name: string;
  color: string;
  x: number;
  y: number;
  /** Card being edited, dragged, or focused — drives remote highlight rings. */
  cardId?: string | null;
  [key: string]: unknown;
}
