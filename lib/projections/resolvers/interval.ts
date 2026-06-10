import type { CSSProperties } from 'react';
import type { CalendarEventT } from '../../schemas/calendar-event';

export type WeekViewState = {
  /** Local midnight at the start of the visible week (Monday). */
  weekStart: Date;
  hourStart: number;
  hourEnd: number;
};

export type CalendarGridMetrics = {
  dayWidth: number;
  hourHeight: number;
  gutterWidth: number;
};

const MS_PER_DAY = 86_400_000;

export function isIntervalInWeek(startIso: string, endIso: string, view: WeekViewState): boolean {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const weekEnd = addDays(view.weekStart, 7);
  return end > view.weekStart && start < weekEnd;
}

export function startOfWeek(date: Date, weekStartsOn = 1): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startLabel = weekStart.toLocaleDateString(undefined, opts);
  const endLabel = end.toLocaleDateString(undefined, {
    ...opts,
    year: weekStart.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

/**
 * Map interval semantics → absolute block geometry in the week grid.
 *
 * React adaptation: returns a style object (or `null` if the event falls outside the
 * visible week) instead of mutating a row element — callers spread this onto
 * `motion.div style`.
 */
export function placeEventBlock(
  event: CalendarEventT,
  view: WeekViewState,
  metrics: CalendarGridMetrics,
): CSSProperties | null {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const weekEnd = addDays(view.weekStart, 7);

  if (end <= view.weekStart || start >= weekEnd) {
    return null;
  }

  const visibleStart = start < view.weekStart ? view.weekStart : start;
  const visibleEnd = end > weekEnd ? weekEnd : end;

  const dayIndex = Math.floor((visibleStart.getTime() - view.weekStart.getTime()) / MS_PER_DAY);
  const viewStartMin = view.hourStart * 60;
  const viewEndMin = view.hourEnd * 60;

  let startMin = minutesOfDay(visibleStart);
  let endMin = minutesOfDay(visibleEnd);

  if (event.allDay || end.getTime() - start.getTime() >= MS_PER_DAY) {
    startMin = viewStartMin;
    endMin = viewEndMin;
  }

  startMin = Math.max(startMin, viewStartMin);
  endMin = Math.min(Math.max(endMin, startMin + 15), viewEndMin);

  const top = ((startMin - viewStartMin) / 60) * metrics.hourHeight;
  const height = Math.max(((endMin - startMin) / 60) * metrics.hourHeight, 22);
  const left = dayIndex * metrics.dayWidth + 2;
  const width = Math.max(metrics.dayWidth - 4, 24);

  return {
    position: 'absolute',
    top,
    left,
    height,
    width,
  };
}

export const sortEvents = (rows: CalendarEventT[]) =>
  [...rows].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
