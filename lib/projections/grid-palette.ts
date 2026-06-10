/** 16-step hue rotation used for grid card theming, keyed by `colorIndex`. */
const STEPS = 16;

export type GridCardPalette = {
  background: string;
  backgroundHover: string;
  border: string;
  foreground: string;
};

export function gridCardPalette(colorIndex: number): GridCardPalette {
  const hue = ((colorIndex % STEPS) / STEPS) * 360;
  return {
    background: `oklch(0.24 0.05 ${hue})`,
    backgroundHover: `oklch(0.3 0.06 ${hue})`,
    border: `oklch(0.36 0.07 ${hue})`,
    foreground: `oklch(0.88 0.04 ${hue})`,
  };
}
