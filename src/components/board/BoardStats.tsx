"use client";

import { AlertCircle, CheckCircle2, LayoutList } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

function dueDateBeforeToday(dueDateIso: string): boolean {
  const [y, m, d] = dueDateIso.slice(0, 10).split("-").map(Number);
  const dueStart = new Date(y, m - 1, d);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dueStart < todayStart;
}

export function BoardStats({ tasks }: { tasks: Task[] }) {
  const { total, completed, overdue } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    /** Past calendar due date, excluding completed (actionable overdue). */
    const overdue = tasks.filter(
      (t) =>
        t.status !== "done" &&
        t.due_date != null &&
        dueDateBeforeToday(t.due_date),
    ).length;
    return { total, completed, overdue };
  }, [tasks]);

  const itemClass = "inline-flex items-center gap-1 text-xs text-muted-foreground";

  return (
    <div
      className="flex flex-nowrap items-center gap-x-3 overflow-x-auto border-b border-border/30 pb-2 text-muted-foreground whitespace-nowrap"
      aria-label="Board summary"
    >
      <span className={itemClass}>
        <LayoutList className="size-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="tabular-nums">{total}</span>
        <span>total</span>
      </span>
      <span className="text-border/80" aria-hidden>
        ·
      </span>
      <span className={itemClass}>
        <CheckCircle2 className="size-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="tabular-nums">{completed}</span>
        <span>done</span>
      </span>
      <span className="text-border/80" aria-hidden>
        ·
      </span>
      <span
        className={cn(
          itemClass,
          overdue > 0 &&
            "font-medium text-rose-700 dark:text-rose-400/90",
        )}
      >
        <AlertCircle
          className={cn(
            "size-3.5 shrink-0 opacity-70",
            overdue > 0 && "text-rose-600 dark:text-rose-400",
          )}
          aria-hidden
        />
        <span className="tabular-nums">{overdue}</span>
        <span>overdue</span>
      </span>
    </div>
  );
}
