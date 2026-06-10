import type { GridCardPalette } from '@/lib/projections/grid-palette';
import type { PlanetT } from '@/lib/schemas/planet';

/** Renders a planet + ring system as SVG, ported from `surface.ts`'s string-builder markup. */
export function PlanetSvg({
  planet,
  palette,
  className,
}: {
  planet: PlanetT;
  palette: GridCardPalette;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <circle
        cx={300}
        cy={300}
        r={planet.radius}
        fill={palette.border}
        stroke={palette.foreground}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {planet.ringRadii.map((r, index) => (
        <circle
          key={index}
          cx={300}
          cy={300}
          r={r}
          fill="none"
          stroke={palette.foreground}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
