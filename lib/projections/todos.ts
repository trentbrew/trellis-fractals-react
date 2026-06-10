import type { TaskT } from '../schemas/task';

/** Split pre-browsed tasks into pending/completed — browse sort is authoritative. */
export function partitionTasks(tasks: TaskT[]) {
  return {
    pending: tasks.filter((task) => !task.done),
    completed: tasks.filter((task) => task.done),
  };
}
