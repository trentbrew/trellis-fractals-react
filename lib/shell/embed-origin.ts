export const PLAYGROUND_PRODUCTION_ORIGIN = 'https://playground.trellis.computer';

/** Default local playground origin (`next dev`). Override via NEXT_PUBLIC_PLAYGROUND_ORIGIN. */
export const LOCAL_PLAYGROUND_ORIGIN =
  process.env.NEXT_PUBLIC_PLAYGROUND_ORIGIN?.replace(/\/$/, '') || 'http://localhost:3000';

export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.split(':')[0] ?? hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
}

/**
 * Embed iframe origin for copy snippets and cross-site references.
 * In the browser, prefers the current page origin (localhost in dev).
 */
export function resolveEmbedOriginFromWindow(): string {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development'
      ? LOCAL_PLAYGROUND_ORIGIN
      : PLAYGROUND_PRODUCTION_ORIGIN;
  }
  return window.location.origin;
}

export function isPlaygroundProductionOrigin(origin: string): boolean {
  return origin.replace(/\/$/, '') === PLAYGROUND_PRODUCTION_ORIGIN;
}

export function embedIframeSnippet(path: string, origin: string): string {
  const src = `${origin.replace(/\/$/, '')}${path}`;
  return `<div style="position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:8px;border:1px solid var(--border,#333);">
  <iframe
    src="${src}"
    title="Trellis Fractals Playground"
    style="position:absolute;inset:0;width:100%;height:100%;border:0;"
    loading="lazy"
    allow="clipboard-write"
  ></iframe>
</div>`;
}
