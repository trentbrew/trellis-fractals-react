'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCollection } from '@/lib/trellis/use-collection';
import { GanttTask, type GanttTaskT } from '@/lib/schemas/gantt-task';
import { applyCollectionBrowse, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import {
  addDays,
  formatWeekRange,
  startOfWeek,
  type WeekViewState,
} from '@/lib/projections/resolvers/interval';
import {
  DEFAULT_GANTT_LANES,
  isTaskInWeek,
  placeGanttBar,
} from '@/lib/projections/resolvers/gantt';
import { useElementWidth } from '@/lib/hooks/use-element-width';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { WeekNavToolbar } from '@/components/shell/WeekNavToolbar';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { GanttBar } from './GanttBar';

const browseConfig = getBrowseConfig<GanttTaskT>(GanttTask);
const LANE_HEIGHT = 56;
const LANE_LABEL_WIDTH = 128;

export function GanttBoard() {
  const { rows, mut } = useCollection(GanttTask);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [trackRef, trackWidth] = useElementWidth<HTMLDivElement>();

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  const view: WeekViewState = useMemo(
    () => ({ weekStart, hourStart: 0, hourEnd: 24 }),
    [weekStart],
  );
  const metrics = { laneHeight: LANE_HEIGHT, laneLabelWidth: LANE_LABEL_WIDTH, trackWidth };

  const browsedRows = useMemo(
    () => applyCollectionBrowse(rows, browseState, browseConfig),
    [rows, browseState],
  );
  const visibleTasks = useMemo(
    () => browsedRows.filter((task) => isTaskInWeek(task, view)),
    [browsedRows, view],
  );

  async function addTask() {
    const start = addDays(weekStart, 1);
    start.setHours(9, 0, 0, 0);
    const end = addDays(weekStart, 3);
    end.setHours(17, 0, 0, 0);
    await mut.create({
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      laneId: 'design',
      colorIndex: rows.length % 16,
    });
  }

  return (
    <BrowseProjectionShell className="gap-4">
      <ProjectionHeader title="Gantt">
        <WeekNavToolbar
          label={formatWeekRange(weekStart)}
          onPrev={() => setWeekStart((prev) => addDays(prev, -7))}
          onNext={() => setWeekStart((prev) => addDays(prev, 7))}
          onToday={() => setWeekStart(startOfWeek(new Date()))}
        />
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          resultCount={browsedRows.length}
          totalCount={rows.length}
          onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
        />
        <AddRecordButton label="New task" onClick={addTask} />
      </ProjectionHeader>

      <div className="overflow-hidden rounded-xl border border-border">
        {DEFAULT_GANTT_LANES.map((lane) => {
          const laneTasks = visibleTasks.filter((task) => task.laneId === lane.id);

          return (
            <div key={lane.id} className="flex border-b border-border last:border-b-0">
              <div
                className="flex shrink-0 items-center border-r border-border px-3 text-xs font-medium text-muted-foreground"
                style={{ width: LANE_LABEL_WIDTH, height: LANE_HEIGHT }}
              >
                {lane.label}
              </div>
              <div
                ref={lane.id === DEFAULT_GANTT_LANES[0]?.id ? trackRef : undefined}
                className="relative flex-1 bg-muted/10"
                style={{ height: LANE_HEIGHT }}
              >
                <AnimatePresence initial={false}>
                  {laneTasks.map((task) => {
                    const style = placeGanttBar(task, view, metrics);
                    if (!style) return null;
                    return (
                      <GanttBar
                        key={task.id}
                        task={task}
                        style={style}
                        view={view}
                        metrics={metrics}
                        trackRef={trackRef}
                        onPersist={(id, patch) => void mut.update(id, patch)}
                        onDelete={(id) => void mut.remove(id)}
                        onContextMenu={(e) => openAt(e, task.id)}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
      {menu}
    </BrowseProjectionShell>
  );
}
