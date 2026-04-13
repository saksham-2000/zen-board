import { COLUMNS } from "@/lib/constants";
import type { Task, TaskStatus } from "@/types";

const COLUMN_IDS = new Set<TaskStatus>(COLUMNS.map((c) => c.id));

export function isBoardColumnId(id: string): id is TaskStatus {
  return COLUMN_IDS.has(id as TaskStatus);
}

export function compareTasksInColumn(a: Task, b: Task): number {
  const dp = (a.board_position ?? 0) - (b.board_position ?? 0);
  if (dp !== 0) return dp;
  return a.created_at.localeCompare(b.created_at);
}

function mergeColumnOrder(
  tasks: Task[],
  status: TaskStatus,
  visibleOrderedIds: string[],
): string[] {
  const inStatus = tasks.filter((t) => t.status === status);
  const visibleSet = new Set(visibleOrderedIds);
  const hidden = inStatus.filter((t) => !visibleSet.has(t.id));
  hidden.sort(compareTasksInColumn);
  const visibleTasks = visibleOrderedIds
    .map((id) => inStatus.find((t) => t.id === id))
    .filter((t): t is Task => t != null);
  return [...visibleTasks, ...hidden].map((t) => t.id);
}

/**
 * Computes next task list after a drag using visible per-column order (filtered board)
 * and full task metadata. Returns null if the drop target is invalid.
 */
export function computeTasksAfterDrag(
  allTasks: Task[],
  byStatusVisible: Map<TaskStatus, Task[]>,
  activeId: string,
  overId: string,
  options?: {
    /** When true, insert after the hovered task (lower half of card / below center). */
    placeAfterOverTask?: boolean;
  },
): Task[] | null {
  if (activeId === overId) return null;

  const activeTask = allTasks.find((t) => t.id === activeId);
  if (!activeTask) return null;

  let targetColumn: TaskStatus;
  let overTaskId: string | null;

  if (isBoardColumnId(overId)) {
    targetColumn = overId;
    overTaskId = null;
  } else {
    const overTask = allTasks.find((t) => t.id === overId);
    if (!overTask) return null;
    targetColumn = overTask.status;
    overTaskId = overId;
  }

  const vis = {} as Record<TaskStatus, string[]>;
  for (const col of COLUMNS) {
    vis[col.id] = (byStatusVisible.get(col.id) ?? []).map((t) => t.id);
  }

  for (const col of COLUMNS) {
    vis[col.id] = vis[col.id].filter((id) => id !== activeId);
  }

  if (overTaskId == null) {
    vis[targetColumn] = [...vis[targetColumn], activeId];
  } else {
    const list = [...vis[targetColumn]];
    const idx = list.indexOf(overTaskId);
    const insertAt =
      idx === -1
        ? list.length
        : options?.placeAfterOverTask
          ? idx + 1
          : idx;
    list.splice(insertAt, 0, activeId);
    vis[targetColumn] = list;
  }

  const next: Task[] = allTasks.map((t) =>
    t.id === activeId ? { ...t, status: targetColumn } : { ...t },
  );

  const fullOrders: Record<TaskStatus, string[]> = {} as Record<
    TaskStatus,
    string[]
  >;
  for (const col of COLUMNS) {
    fullOrders[col.id] = mergeColumnOrder(next, col.id, vis[col.id]);
  }

  return next.map((t) => {
    const ord = fullOrders[t.status];
    const pos = ord.indexOf(t.id);
    return { ...t, board_position: pos >= 0 ? pos : t.board_position ?? 0 };
  });
}
