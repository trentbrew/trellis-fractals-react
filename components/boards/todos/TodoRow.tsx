'use client';

import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import type { TaskT } from '@/lib/schemas/task';
import { cn } from '@/lib/utils';

export function TodoRow({
  task,
  onToggle,
  onDelete,
}: {
  task: TaskT;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.li
      layout
      layoutId={`task-${task.id}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.45 }}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <label className="flex flex-1 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={task.done}
          onChange={() => onToggle(task.id, !task.done)}
        />
        <span className={cn('font-medium', task.done && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
      </label>
      <button
        type="button"
        aria-label="Delete todo"
        onClick={() => onDelete(task.id)}
        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
      >
        <XIcon className="size-4" />
      </button>
    </motion.li>
  );
}
