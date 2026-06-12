/** Square iframe aspect ratio (width ÷ height) for fractal blog embeds. */
export const EMBED_ASPECT_RATIO = 1;

/** @deprecated Square embeds size from container width — kept for gallery copy fallbacks. */
export const EMBED_FRAME_HEIGHT = 560;

/** Legacy reserve — dock is in-flow at top in square embeds. */
export const EMBED_DOCK_RESERVE_PX = 72;

const SQUARE_FRACTAL_EMBED_PREFIXES = [
  '/fractals/collection',
  '/fractals/entity',
  '/fractals/page',
  '/fractals/app',
] as const;

/** Fractal routes that fill a square iframe with top dock + scrolling content. */
export function isSquareFractalEmbed(pathname: string): boolean {
  return SQUARE_FRACTAL_EMBED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
