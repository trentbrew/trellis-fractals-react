/** Query params stripped from invite links — opens the full app, not embed chrome. */
const STRIP_PARAMS = new Set(['embed', 'readonly', 'configure']);

/**
 * Build a shareable room URL for the current view.
 * Keeps path + non-embed params; always sets `room`.
 */
export function buildRoomShareUrl(opts: {
  origin: string;
  pathname: string;
  room: string;
  search?: string;
}): string {
  const url = new URL(opts.pathname, opts.origin);
  const raw = opts.search ?? '';
  const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);

  for (const [key, value] of params) {
    if (!STRIP_PARAMS.has(key)) {
      url.searchParams.set(key, value);
    }
  }

  url.searchParams.set('room', opts.room);
  return url.toString();
}
