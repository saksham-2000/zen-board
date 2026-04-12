"use client";

import { useMemo } from "react";
import { Column } from "./Column";
import { COLUMNS } from "@/lib/constants";
import { useTasks } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@/types";

export function Board() {
  const { tasks, loading, error } = useTasks();

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const task of tasks) {
      const list = map.get(task.status);
      if (list) list.push(task);
    }
    return map;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
        Loading board…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-x-auto px-4 md:px-6">
        <div className="flex h-full min-h-0 gap-6 pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              status={col.id}
              title={col.label}
              tasks={byStatus.get(col.id) ?? []}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
