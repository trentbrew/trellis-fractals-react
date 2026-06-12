/** True when loaded inside an iframe embed (`?embed=1` or `?embed=true`). */
export function isEmbedMode(search = ''): boolean {
  const value = parseSearch(search).get('embed');
  return value === '1' || value === 'true';
}

/** True when mutations should be disabled (`?readonly=1` or `?readonly=true`). */
export function isReadonlyEmbed(search = ''): boolean {
  const value = parseSearch(search).get('readonly');
  return value === '1' || value === 'true';
}

function parseSearch(search: string): URLSearchParams {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

const READONLY_KICKER =
  'Live graph showcase — read-only. Open playground.trellis.computer to edit.';
const LIVE_GRAPH_KICKER =
  'Live graph — edits sync across tabs; add ?room=name to the URL to share across browsers';
const KANBAN_EMBED_KICKER =
  'Live kanban — drag cards and edit titles. Open a second tab with the same URL for presence cursors (same browser).';
const FRACTALS_LADDER_KICKER =
  'Fractal ladder — containment levels and projection bands. Live demos: entity · collection · kanban.';

/** Routes that make sense as brew.build iframe embeds (`?embed=1`). */
export function embedKickerForPath(pathname: string, readonly = false): string | null {
  if (pathname.startsWith('/fractals/ladder')) {
    return FRACTALS_LADDER_KICKER;
  }
  if (pathname.startsWith('/fractals/entity')) {
    return 'Fractal entity — drag the vantage slider: dot → chip → row → card → panel → page.';
  }
  if (pathname.startsWith('/fractals/collection')) {
    return readonly
      ? 'Fractal collection — vantage switches graph, table, list, and grid projections.'
      : `${LIVE_GRAPH_KICKER} Use presets or the slider to collapse projections on the same Card collection.`;
  }
  if (pathname.startsWith('/fractals/page')) {
    return 'Fractal page — vantage switches graph, outline, and layout; sidebar follows page graph edges.';
  }
  if (pathname.startsWith('/fractals/app')) {
    return 'App containment (sketch) — the shell as a collapsible object.';
  }
  if (pathname.startsWith('/fractals/embeds')) {
    return 'Blog embed QA — preview iframes before publish on brew.build.';
  }
  if (pathname.startsWith('/fractals/')) {
    return 'Fractals playground — open playground.trellis.computer/fractals for the full rail.';
  }
  if (!pathname.startsWith('/projections/')) return null;
  if (pathname === '/projections/kanban') {
    return readonly ? READONLY_KICKER : KANBAN_EMBED_KICKER;
  }
  if (pathname === '/projections/fractal') {
    return 'Context-rendered projection fixture.';
  }
  if (readonly) return READONLY_KICKER;
  return LIVE_GRAPH_KICKER;
}
