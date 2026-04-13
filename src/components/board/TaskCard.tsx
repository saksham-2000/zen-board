"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar } from "lucide-react";
import { labelAvatarSolidClass, labelPillClass } from "@/lib/label-colors";
import {
  memberInitials,
  teamMemberAccentColor,
} from "@/lib/team-member-utils";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/types";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  /** Renders without sortable behavior (e.g. inside DragOverlay). */
  isOverlay?: boolean;
}

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  high: "High",
  normal: "Normal",
  low: "Low",
};

const PRIORITY_TEXT_COLOR: Record<TaskPriority, string> = {
  high: "rgba(220, 38, 38, 0.85)",
  normal: "rgba(59, 130, 246, 0.7)",
  low: "rgba(148, 163, 184, 0.5)",
};

function PriorityLabel({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className="shrink-0 text-[11px] font-semibold tabular-nums tracking-wide"
      style={{ color: PRIORITY_TEXT_COLOR[priority] }}
    >
      {PRIORITY_TEXT[priority]}
    </span>
  );
}

function formatDueDateShort(value: string): string {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type DueUrgency = "overdue" | "soon" | "normal";

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

const DUE_GROUP_CLASS: Record<DueUrgency, string> = {
  overdue: "text-[#dc2626]",
  soon: "text-[#d97706]",
  normal: "text-muted-foreground",
};

const MAX_LABEL_PILLS = 3;
const MAX_ASSIGNEE_AVATARS = 3;

function TaskCardSurface({ task, onClick, isOverlay }: TaskCardProps) {
  const labelList = task.labels ?? [];
  const visibleLabels = labelList.slice(0, MAX_LABEL_PILLS);
  const labelOverflow = labelList.length - visibleLabels.length;

  const assigneeList = task.assignees ?? [];
  const visibleAssignees = assigneeList.slice(0, MAX_ASSIGNEE_AVATARS);
  const assigneeOverflow = assigneeList.length - visibleAssignees.length;
  const assigneeNamesTitle = assigneeList.map((a) => a.name).join(", ");

  const dueUrgency =
    task.due_date != null ? getDueUrgency(task.due_date) : null;
  const showDueBlock = Boolean(task.due_date && dueUrgency);
  const showAssignees = assigneeList.length > 0;
  const showMetaRow = showDueBlock || showAssignees;

  const cardInner = (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[10px] border-[0.5px] border-border bg-card py-[14px] pr-4 pl-4 shadow-sm transition-all duration-150",
        !isOverlay &&
          "hover:-translate-y-px hover:border-border hover:shadow-md",
        isOverlay && "cursor-grabbing opacity-95 shadow-lg",
        !isOverlay && "cursor-pointer",

      )}
      onClick={isOverlay ? undefined : onClick}
    >
      {/* Row 1 — title + priority */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 text-[14px] font-medium leading-[1.35] text-foreground",
            "line-clamp-2",
            task.status === "done" &&
              "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          {task.title}
        </p>
        <PriorityLabel priority={task.priority} />
      </div>

      {/* Row 2 — labels */}
      {visibleLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visibleLabels.map((label) => (
            <span
              key={label.id}
              title={label.name}
              className={cn("inline-block max-w-full", labelPillClass(label.color))}
            >
              {label.name}
            </span>
          ))}
          {labelOverflow > 0 ? (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{labelOverflow}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Row 3 — due date + assignees */}
      {showMetaRow ? (
        <div className="flex min-h-[24px] items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {showDueBlock && task.due_date && dueUrgency ? (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs tabular-nums",
                  DUE_GROUP_CLASS[dueUrgency],
                )}
              >
                <Calendar
                  className="size-3.5 shrink-0 stroke-[1.75]"
                  stroke="currentColor"
                  aria-hidden
                />
                <span>{formatDueDateShort(task.due_date)}</span>
              </div>
            ) : null}
          </div>
          {showAssignees ? (
            <div
              className="flex shrink-0 items-center overflow-visible pl-1.5"
              title={assigneeNamesTitle}
            >
              {visibleAssignees.map((m) => (
                <span
                  key={m.id}
                  className={cn(
                    "-ml-1.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none shadow-sm ring-2 ring-card first:ml-0",
                    labelAvatarSolidClass(teamMemberAccentColor(m)),
                  )}
                >
                  {memberInitials(m.name)}
                </span>
              ))}
              {assigneeOverflow > 0 ? (
                <span className="-ml-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium tabular-nums leading-none text-muted-foreground shadow-sm ring-2 ring-card first:ml-0">
                  +{assigneeOverflow}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return cardInner;
}

export function TaskCard(props: TaskCardProps) {
  if (props.isOverlay) {
    return <TaskCardSurface {...props} />;
  }
  return <SortableTaskCard {...props} />;
}

export function SortableTaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0 } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none outline-none"
      {...listeners}
      {...attributes}
    >
      <TaskCardSurface task={task} onClick={onClick} />
    </div>
  );
}
