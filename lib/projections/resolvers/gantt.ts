import type { CSSProperties } from 'react';
import type { GanttLane, GanttTaskT } from '../../schemas/gantt-task';
import { addDays, isIntervalInWeek, type WeekViewState } from './interval';

export type GanttLaneDef = {
  id: GanttLane;
  label: string;
};

export const DEFAULT_GANTT_LANES: GanttLaneDef[] = [
  { id: 'design', label: 'Design' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'ops', label: 'Ops' },
];

export type GanttMetrics = {
  laneHeight: number;
  laneLabelWidth: number;
  trackWidth: number;
};

const MS_PER_WEEK = 7 * 86_400_000;

export const laneIndex = (laneId: GanttLane) =>
  DEFAULT_GANTT_LANES.findIndex((lane) => lane.id === laneId);

export const sortGanttTasks = (rows: GanttTaskT[]) =>
  [...rows].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));

export const isTaskInWeek = (task: GanttTaskT, view: WeekViewState) =>
  isIntervalInWeek(task.start, task.end, view);

/**
 * Interval × lane placement — horizontal bars in swimlane tracks.
 *
 * React adaptation: returns a style object (or `null` if the task falls outside the
 * visible week) instead of mutating a row element — callers spread this onto
 * `motion.div style`.
 */
export function placeGanttBar(
  task: GanttTaskT,
  view: WeekViewState,
  metrics: GanttMetrics,
): CSSProperties | null {
  const start = new Date(task.start);
  const end = new Date(task.end);
  const weekEnd = addDays(view.weekStart, 7);

  if (!isIntervalInWeek(task.start, task.end, view)) {
    return null;
  }

  const visibleStart = start < view.weekStart ? view.weekStart : start;
  const visibleEnd = end > weekEnd ? weekEnd : end;
  const duration = visibleEnd.getTime() - visibleStart.getTime();
  if (duration <= 0) {
    return null;
  }

  const left =
    ((visibleStart.getTime() - view.weekStart.getTime()) / MS_PER_WEEK) * metrics.trackWidth;
  const width = Math.max((duration / MS_PER_WEEK) * metrics.trackWidth, 28);

  return {
    position: 'absolute',
    left: left + 2,
    width: width - 4,
    top: 6,
    height: metrics.laneHeight - 12,
  };
}

/** Map pointer X within track → ISO end instant (semantic resize). */
export function endFromTrackX(
  clientX: number,
  trackRect: DOMRect,
  view: WeekViewState,
  startIso: string,
): string {
  const ratio = Math.min(Math.max((clientX - trackRect.left) / trackRect.width, 0), 1);
  const weekEnd = addDays(view.weekStart, 7);
  const ms = view.weekStart.getTime() + ratio * MS_PER_WEEK;
  const startMs = new Date(startIso).getTime();
  const next = Math.max(ms, startMs + 15 * 60_000);
  return new Date(Math.min(next, weekEnd.getTime())).toISOString();
}
