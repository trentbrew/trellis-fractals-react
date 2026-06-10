'use client';

import { motion } from 'framer-motion';
import { PLANET_TYPES, type PlanetT } from '@/lib/schemas/planet';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { PlanetSvg } from './PlanetSvg';

export function PlanetCard({
  planet,
  onOpen,
  onContextMenu,
}: {
  planet: PlanetT;
  onOpen: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}) {
  const palette = gridCardPalette(planet.colorIndex);

  return (
    <motion.button
      type="button"
      layout
      layoutId={`planet-${planet.id}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.45 }}
      onClick={onOpen}
      onContextMenu={onContextMenu}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-colors hover:bg-muted/50"
    >
      <div className="flex aspect-video items-center justify-center border-b border-border bg-muted/20">
        <PlanetSvg planet={planet} palette={palette} className="h-3/4 w-3/4" />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <span className="w-fit rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {PLANET_TYPES[planet.planetType]}
        </span>
        <h3 className="text-sm font-medium line-clamp-1">{planet.title || 'Untitled planet'}</h3>
        {planet.intro && (
          <p className="text-xs text-muted-foreground line-clamp-2">{planet.intro}</p>
        )}
      </div>
    </motion.button>
  );
}
