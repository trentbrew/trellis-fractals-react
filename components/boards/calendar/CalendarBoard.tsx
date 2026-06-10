'use client';

import { Fragment, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCollection } from '@/lib/trellis/use-collection';
import { CalendarEvent, type CalendarEventT } from '@/lib/schemas/calendar-event';
import { applyCollectionBrowse, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import {
  addDays,
  formatWeekRange,
  isIntervalInWeek,
  placeEventBlock,
  startOfWeek,
  weekDays,
  type WeekViewState,
} from '@/lib/projections/resolvers/interval';
import { useElementWidth } from '@/lib/hooks/use-element-width';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { WeekNavToolbar } from '@/components/shell/WeekNavToolbar';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { cn } from '@/lib/utils';
import { EventBlock } from './EventBlock';

const browseConfig = getBrowseConfig<CalendarEventT>(CalendarEvent);
const HOUR_START = 8;
const HOUR_END = 20;
const HOUR_HEIGHT = 48;
const GUTTER_WIDTH = 48;

export function CalendarBoard() {
  const { rows, mut } = useCollection(CalendarEvent);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [bodyRef, bodyWidth] = useElementWidth<HTMLDivElement>();

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  const view: WeekViewState = useMemo(
    () => ({ weekStart, hourStart: HOUR_START, hourEnd: HOUR_END }),
    [weekStart],
  );
  const dayWidth = Math.max((bodyWidth - GUTTER_WIDTH) / 7, 64);
  const metrics = { dayWidth, hourHeight: HOUR_HEIGHT, gutterWidth: GUTTER_WIDTH };

  const browsedRows = useMemo(
    () => applyCollectionBrowse(rows, browseState, browseConfig),
    [rows, browseState],
  );
  const visibleEvents = useMemo(
    () => browsedRows.filter((event) => isIntervalInWeek(event.start, event.end, view)),
    [browsedRows, view],
  );

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const dayHeaders = weekDays(weekStart).map((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return {
      date,
      label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      isToday: d.getTime() === today.getTime(),
    };
  });

  async function addEvent() {
    const start = addDays(weekStart, 1);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);
    await mut.create({
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      colorIndex: rows.length % 16,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <ProjectionHeader title="Calendar">
        <CollectionViewHint schema={CalendarEvent} current="calendar" />
        <WeekNavToolbar
          label={formatWeekRange(weekStart)}
          onPrev={() => setWeekStart((prev) => addDays(prev, -7))}
          onNext={() => setWeekStart((prev) => addDays(prev, 7))}
          onToday={() => setWeekStart(startOfWeek(new Date()))}
        />
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
        />
        <AddRecordButton label="New event" onClick={addEvent} />
      </ProjectionHeader>

      <div className="overflow-hidden rounded-xl border border-border">
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: `${GUTTER_WIDTH}px repeat(7, 1fr)` }}
        >
          <div />
          {dayHeaders.map((day) => (
            <div
              key={day.date.toISOString()}
              className={cn(
                'border-l border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground',
                day.isToday && 'bg-primary/5 text-primary',
              )}
            >
              {day.label}
            </div>
          ))}
        </div>

        <div
          ref={bodyRef}
          className="relative"
          style={{ height: (HOUR_END - HOUR_START) * HOUR_HEIGHT }}
        >
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `${GUTTER_WIDTH}px repeat(7, 1fr)` }}
          >
            {hours.map((hour) => (
              <Fragment key={hour}>
                <div
                  className="border-t border-border px-1.5 pt-0.5 text-right text-[10px] text-muted-foreground"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {hour}:00
                </div>
                {dayHeaders.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className="border-t border-l border-border"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
              </Fragment>
            ))}
          </div>

          <div className="absolute inset-y-0 right-0" style={{ left: GUTTER_WIDTH }}>
            <AnimatePresence initial={false}>
              {visibleEvents.map((event) => {
                const style = placeEventBlock(event, view, metrics);
                if (!style) return null;
                return (
                  <EventBlock
                    key={event.id}
                    event={event}
                    style={style}
                    onPersist={(id, patch) => void mut.update(id, patch)}
                    onDelete={(id) => void mut.remove(id)}
                    onContextMenu={(e) => openAt(e, event.id)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {menu}
    </div>
  );
}
