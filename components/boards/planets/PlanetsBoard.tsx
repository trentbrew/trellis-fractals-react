'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollection } from '@/lib/trellis/use-collection';
import { Planet, type PlanetT } from '@/lib/schemas/planet';
import { applyCollectionBrowse, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { PlanetCard } from './PlanetCard';
import { PlanetDetailDialog } from './PlanetDetailDialog';

const browseConfig = getBrowseConfig<PlanetT>(Planet);

export function PlanetsBoard() {
  const { rows, mut } = useCollection(Planet);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));
  const [openId, setOpenId] = useState<string | null>(null);

  const browsedRows = useMemo(
    () => applyCollectionBrowse(rows, browseState, browseConfig),
    [rows, browseState],
  );

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  async function addPlanet() {
    await mut.create({
      title: 'New planet',
      intro: '',
      body: '',
      planetType: 0,
      radius: 80,
      colorIndex: rows.length % 16,
      ringRadii: [],
    });
  }

  const openPlanet = openId ? (rows.find((row) => row.id === openId) ?? null) : null;

  return (
    <BrowseProjectionShell className="gap-4">
      <ProjectionHeader title="Planets">
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          resultCount={browsedRows.length}
          totalCount={rows.length}
          onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
        />
        <AddRecordButton label="New planet" onClick={addPlanet} />
      </ProjectionHeader>

      <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence initial={false}>
          {browsedRows.map((planet) => (
            <PlanetCard
              key={planet.id}
              planet={planet}
              onOpen={() => setOpenId(planet.id)}
              onContextMenu={(event) => openAt(event, planet.id)}
            />
          ))}
        </AnimatePresence>
        {browsedRows.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            {rows.length === 0
              ? 'No planets yet — add one above.'
              : 'No matches — try another search.'}
          </p>
        )}
      </motion.div>

      <PlanetDetailDialog
        planet={openPlanet}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onPersist={(id, patch) => void mut.update(id, patch)}
        onDelete={(id) => {
          void mut.remove(id);
          setOpenId(null);
        }}
      />
      {menu}
    </BrowseProjectionShell>
  );
}
