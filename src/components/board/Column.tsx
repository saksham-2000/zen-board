"use client";

import { useDroppable } from "@dnd-kit/core";
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
  todo: "border-l-slate-400/50",
  in_progress: "border-l-sky-500/40",
  in_review: "border-l-amber-500/40",
  done: "border-l-emerald-500/40",
};

export function Column({ status, title, tasks, onTaskClick, onAddClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-0 w-[290px] shrink-0 flex-col rounded-xl bg-slate-50/90 transition-colors dark:bg-slate-950/35",
        isOver &&
          "bg-sky-500/[0.07] ring-2 ring-sky-500/25 ring-inset dark:bg-sky-500/10 dark:ring-sky-400/20",
      )}
    >
      <header className={cn("border-l-[3px] border-solid px-3 pb-2 pt-3", ACCENT[status])}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 shrink text-sm font-medium tracking-tight text-foreground/90">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            <span className="rounded-md bg-background/70 px-1.5 py-px text-[11px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/40">
              {tasks.length}
            </span>
            {onAddClick ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:bg-background/80 hover:text-foreground"
                onClick={onAddClick}
                aria-label={`Add task to ${title}`}
              >
                <PlusIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3 pt-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick ? () => onTaskClick(task) : undefined} />
        ))}
      </div>
    </div>
  );
}
