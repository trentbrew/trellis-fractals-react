'use client';

import { useState } from 'react';
import { TrashIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { PLANET_TYPES, type PlanetT } from '@/lib/schemas/planet';
import { PlanetSvg } from './PlanetSvg';

type PlanetPatch = {
  title?: string;
  intro?: string;
  body?: string;
  planetType?: number;
  radius?: number;
  ringRadii?: number[];
};

export function PlanetDetailDialog({
  planet,
  onOpenChange,
  onPersist,
  onDelete,
}: {
  planet: PlanetT | null;
  onOpenChange: (open: boolean) => void;
  onPersist: (id: string, patch: PlanetPatch) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog open={planet != null} onOpenChange={onOpenChange}>
      {planet && (
        <PlanetDetailContent
          key={planet.id}
          planet={planet}
          onPersist={onPersist}
          onDelete={onDelete}
        />
      )}
    </Dialog>
  );
}

function PlanetDetailContent({
  planet,
  onPersist,
  onDelete,
}: {
  planet: PlanetT;
  onPersist: (id: string, patch: PlanetPatch) => void;
  onDelete: (id: string) => void;
}) {
  const palette = gridCardPalette(planet.colorIndex);
  const [radius, setRadius] = useState(planet.radius);
  const [ringRadiiText, setRingRadiiText] = useState(planet.ringRadii.join(', '));

  const title = useFocusSafeField(planet.title, (value) => onPersist(planet.id, { title: value }));
  const intro = useFocusSafeField(planet.intro, (value) => onPersist(planet.id, { intro: value }));
  const body = useFocusSafeField(planet.body, (value) => onPersist(planet.id, { body: value }));

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Planet details</DialogTitle>
      </DialogHeader>

      <div className="flex aspect-[2/1] items-center justify-center rounded-lg border border-border bg-muted/20">
        <PlanetSvg planet={{ ...planet, radius }} palette={palette} className="h-3/4 w-3/4" />
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <input
            value={title.value}
            onChange={title.onChange}
            onFocus={title.onFocus}
            onBlur={title.onBlur}
            onKeyDown={title.onKeyDown}
            placeholder="Untitled planet"
            className="rounded-md border border-border bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <Select
            value={String(planet.planetType)}
            onValueChange={(value) => {
              if (value != null) onPersist(planet.id, { planetType: Number(value) });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANET_TYPES.map((label, index) => (
                <SelectItem key={index} value={String(index)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Intro</span>
          <textarea
            value={intro.value}
            onChange={intro.onChange}
            onFocus={intro.onFocus}
            onBlur={intro.onBlur}
            rows={2}
            placeholder="Short description…"
            className="resize-none rounded-md border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Notes</span>
          <textarea
            value={body.value}
            onChange={body.onChange}
            onFocus={body.onFocus}
            onBlur={body.onBlur}
            rows={3}
            placeholder="Notes…"
            className="resize-none rounded-md border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">
            Radius — {radius}
          </span>
          <input
            type="range"
            min={20}
            max={280}
            value={radius}
            onChange={(event) => setRadius(Number(event.currentTarget.value))}
            onPointerUp={() => onPersist(planet.id, { radius })}
            className="accent-primary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Ring radii (comma-separated)</span>
          <input
            value={ringRadiiText}
            onChange={(event) => setRingRadiiText(event.currentTarget.value)}
            onBlur={() => {
              const ringRadii = ringRadiiText
                .split(',')
                .map((part) => Number(part.trim()))
                .filter((value) => Number.isFinite(value) && value > 0);
              setRingRadiiText(ringRadii.join(', '));
              onPersist(planet.id, { ringRadii });
            }}
            placeholder="e.g. 320, 380"
            className="rounded-md border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="destructive"
          className="gap-1.5"
          onClick={() => onDelete(planet.id)}
        >
          <TrashIcon className="size-4" />
          Delete planet
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
