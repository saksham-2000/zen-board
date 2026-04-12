"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { labelColorClass, labelDotClass } from "@/lib/label-colors";
import { memberInitials } from "@/lib/team-member-utils";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/types";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  /** Renders without draggable behavior (e.g. inside DragOverlay). */
  isOverlay?: boolean;
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-rose-400/50",
  normal: "bg-slate-400/55",
  low: "bg-zinc-400/50",
};

function formatDueDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type DueUrgency = "overdue" | "soon" | "normal";

// Urgency tiers: overdue, soon (within 48h), or normal.
function getDueUrgency(dueDateIso: string): DueUrgency {
  const [y, m, d] = dueDateIso.slice(0, 10).split("-").map(Number);
  const dueDay = new Date(y, m - 1, d);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dueStart = new Date(
    dueDay.getFullYear(),
    dueDay.getMonth(),
    dueDay.getDate(),
  );
  if (dueStart < todayStart) return "overdue";
  if (
    dueStart.getTime() === todayStart.getTime() ||
    dueStart.getTime() === tomorrowStart.getTime()
  ) {
    return "soon";
  }
  return "normal";
}

const URGENCY_DOT: Record<DueUrgency, string> = {
  overdue: "bg-rose-400/55",
  soon: "bg-amber-400/50",
  normal: "bg-muted-foreground/40",
};

const URGENCY_TEXT: Record<DueUrgency, string> = {
  overdue: "text-rose-800/90 dark:text-rose-400/85",
  soon: "text-amber-900/85 dark:text-amber-400/80",
  normal: "text-muted-foreground",
};

export function TaskCard({ task, onClick, isOverlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: Boolean(isOverlay),
  });

  const dueUrgency = task.due_date ? getDueUrgency(task.due_date) : null;
  const labelList = task.labels ?? [];
  const maxLabelDots = 3;
  const visibleLabels = labelList.slice(0, maxLabelDots);
  const labelOverflow = labelList.length - visibleLabels.length;

  const assigneeList = task.assignees ?? [];
  const maxAssigneeAvatars = 3;
  const visibleAssignees = assigneeList.slice(0, maxAssigneeAvatars);
  const assigneeOverflow = assigneeList.length - visibleAssignees.length;
  const assigneeNamesTitle = assigneeList.map((a) => a.name).join(", ");

  const card = (
    <Card
      size="sm"
      className={cn(
        "gap-0 border-border py-0 shadow-sm transition-all duration-150",
        !isOverlay &&
          "hover:-translate-y-px hover:border-border hover:shadow-md",
        isOverlay && "cursor-grabbing opacity-95 shadow-lg",
        !isOverlay &&
          cn(
            "cursor-grab active:cursor-grabbing",
            onClick && "hover:cursor-pointer",
          ),
        isDragging && "opacity-45",
      )}
      onClick={isOverlay ? undefined : onClick}
    >
      <CardContent
        className={cn(
          "relative flex flex-col gap-2 px-3 py-3",
          assigneeList.length > 0 && "pb-8",
        )}
      >
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className={cn(
              "mt-1.5 size-1.5 shrink-0 rounded-full",
              PRIORITY_DOT[task.priority],
            )}
          />
          <p className="min-w-0 flex-1 truncate text-sm font-medium leading-snug text-foreground">
            {task.title}
          </p>
        </div>
        {visibleLabels.length > 0 ? (
          <div className="flex items-center gap-1 pl-3.5">
            {visibleLabels.map((label) => (
              <span
                key={label.id}
                title={label.name}
                className={cn(
                  "size-1.5 shrink-0 rounded-full transition-opacity hover:opacity-80",
                  labelDotClass(label.color),
                )}
              />
            ))}
            {labelOverflow > 0 ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                +{labelOverflow} more
              </span>
            ) : null}
          </div>
        ) : null}
        {task.due_date && dueUrgency ? (
          <div className="flex items-center gap-1.5 pl-3.5">
            <span
              aria-hidden
              className={cn("size-1 shrink-0 rounded-full", URGENCY_DOT[dueUrgency])}
            />
            <span
              className={cn(
                "text-xs font-normal tabular-nums",
                URGENCY_TEXT[dueUrgency],
              )}
            >
              {formatDueDate(task.due_date)}
              {dueUrgency === "overdue" ? (
                <span className="ml-1.5 text-xs font-medium tracking-wide text-rose-700/90 uppercase dark:text-rose-400/80">
                  Overdue
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
        {assigneeList.length > 0 ? (
          <div
            className="pointer-events-none absolute bottom-2 right-2 flex items-center"
            title={assigneeNamesTitle}
          >
            <div className="pointer-events-auto flex items-center -space-x-1">
              {visibleAssignees.map((m, i) => (
                <span
                  key={m.id}
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border-2 border-card text-xs font-semibold leading-none",
                    labelColorClass(m.color),
                  )}
                  style={{ zIndex: visibleAssignees.length - i }}
                >
                  {memberInitials(m.name)}
                </span>
              ))}
              {assigneeOverflow > 0 ? (
                <span className="z-10 flex size-5 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium tabular-nums leading-none text-muted-foreground">
                  +{assigneeOverflow}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (isOverlay) return card;

  return (
    <div
      ref={setNodeRef}
      className="touch-none outline-none"
      {...listeners}
      {...attributes}
    >
      {card}
    </div>
  );
}
