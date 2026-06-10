'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollection } from '@/lib/trellis/use-collection';
import { Task, type TaskT } from '@/lib/schemas/task';
import { applyCollectionBrowse, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import { partitionTasks } from '@/lib/projections/todos';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { Input } from '@/components/ui/input';
import { TodoRow } from './TodoRow';

const browseConfig = getBrowseConfig<TaskT>(Task);

export function TodoBoard() {
  const { rows, mut } = useCollection(Task);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));
  const [newTitle, setNewTitle] = useState('');

  const browsedRows = useMemo(
    () => applyCollectionBrowse(rows, browseState, browseConfig),
    [rows, browseState],
  );
  const { pending, completed } = partitionTasks(browsedRows);

  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    await mut.create({ title, done: false });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <ProjectionHeader title="Todos">
        <CollectionViewHint schema={Task} current="list" />
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          resultCount={browsedRows.length}
          totalCount={rows.length}
          onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
        />
      </ProjectionHeader>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void addTask();
        }}
      >
        <input type="checkbox" disabled className="size-4" />
        <Input
          required
          placeholder="What needs to be done?"
          value={newTitle}
          onChange={(event) => setNewTitle(event.currentTarget.value)}
          className="flex-1"
        />
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Pending
        </h2>
        <motion.ul layout className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {pending.map((task) => (
              <TodoRow
                key={task.id}
                task={task}
                onToggle={(id, done) => void mut.update(id, { done })}
                onDelete={(id) => void mut.remove(id)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Completed
        </h2>
        <motion.ul layout className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {completed.map((task) => (
              <TodoRow
                key={task.id}
                task={task}
                onToggle={(id, done) => void mut.update(id, { done })}
                onDelete={(id) => void mut.remove(id)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      </section>

      {browsedRows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {rows.length === 0 ? 'No tasks yet — add one above.' : 'No matches — try another search.'}
        </p>
      )}
    </div>
  );
}
