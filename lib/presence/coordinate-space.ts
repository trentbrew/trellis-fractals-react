/**
 * Presence cursors use literal viewport coordinates (clientX / clientY).
 * No normalization, no scroll-container transform — what you send is where it renders.
 */
export function resolvePointerPresence(
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  return { x: clientX, y: clientY };
}

export function viewportToFixed(x: number, y: number): { left: number; top: number } {
  return { left: x, top: y };
}
