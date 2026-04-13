"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusIcon } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddClick?: () => void;
}

const ACCENT: Record<TaskStatus, string> = {
  todo: "border-l-slate-400/55",
  in_progress: "border-l-sky-400/45",
  in_review: "border-l-amber-400/45",
  done: "border-l-emerald-500/40",
};

export function Column({ status, title, tasks, onTaskClick, onAddClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-0 w-[min(calc(100vw-2rem),280px)] min-w-[min(calc(100vw-2rem),280px)] shrink-0 flex-col rounded-xl border border-border/50 bg-muted/15 transition-colors duration-150 max-md:snap-start dark:border-border/30 dark:bg-muted/10 md:w-56 md:min-w-56 lg:w-[280px] lg:min-w-[280px]",
        isOver &&
          "bg-sky-500/[0.06] ring-2 ring-inset ring-sky-400/20 dark:bg-sky-500/[0.08] dark:ring-sky-400/15",
      )}
    >
      <header
        className={cn(
          "border-l-2 border-solid px-3 pb-2 pt-3",
          ACCENT[status],
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 shrink text-sm font-medium uppercase tracking-wide text-foreground/85">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            <span className="rounded-md border border-border/50 bg-card/90 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {tasks.length}
            </span>
            {onAddClick ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:bg-card/90 hover:text-foreground"
                onClick={onAddClick}
                aria-label={`Add task to ${title}`}
              >
                <PlusIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-visible px-3 pb-3 pt-2">
        {tasks.length === 0 ? (
          <div className="flex min-h-28 flex-1 items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/30 px-3 py-6 transition-colors hover:border-border">
            <p className="text-xs text-muted-foreground">No tasks</p>
          </div>
        ) : (
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick ? () => onTaskClick(task) : undefined}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
