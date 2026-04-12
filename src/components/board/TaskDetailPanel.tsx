"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { LabelsStore } from "@/hooks/use-labels";
import type { TeamMembersStore } from "@/hooks/use-team-members";
import { COLUMNS } from "@/lib/constants";
import { labelColorClass } from "@/lib/label-colors";
import { memberInitials } from "@/lib/team-member-utils";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { AssigneePicker } from "./AssigneePicker";
import { LabelManager } from "./LabelManager";
import { LabelPicker } from "./LabelPicker";

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Refetch tasks after label assignment changes (joined `task.labels`). */
  onTasksRefetch?: () => void | Promise<void>;
  /** Same `useLabels()` instance as the board so new labels appear in the filter bar without refresh. */
  labelsStore: LabelsStore;
  teamMembersStore: TeamMembersStore;
  assignMember: (taskId: string, memberId: string) => Promise<void>;
  unassignMember: (taskId: string, memberId: string) => Promise<void>;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Unknown";
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week} week${week === 1 ? "" : "s"} ago`;
  const mo = Math.floor(day / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

function formatDueDateLong(value: string | null): string {
  if (!value) return "No due date";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: TaskStatus): string {
  return COLUMNS.find((c) => c.id === status)?.label ?? status;
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: "border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  in_progress: "border-sky-500/35 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  in_review: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  done: "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
};

export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onTasksRefetch,
  labelsStore,
  teamMembersStore,
  assignMember,
  unassignMember,
}: TaskDetailPanelProps) {
  const {
    labels: allLabels,
    loading: labelsLoading,
    createLabel,
    deleteLabel,
    addLabelToTask,
    removeLabelFromTask,
  } = labelsStore;
  const { members: allTeamMembers } = teamMembersStore;

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");

  // Re-seed edit fields when switching tasks only; avoid resetting on refetch of the same id.
  useEffect(
    () => {
      if (!task) return;
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
      setStatus(task.status);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task?.id],
  );

  useEffect(
    () => {
      if (open && task) {
        setMode("view");
        setDeleteConfirm(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, task?.id],
  );

  function discardEdit() {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setStatus(task.status);
    setMode("view");
  }

  async function handleSave() {
    if (!task || !title.trim()) return;
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        priority,
        due_date: dueDate || null,
        status,
      });
      setMode("view");
    } catch {
      /* error surfaced via hook / future toast */
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!task) return;
    setDeleting(true);
    try {
      await onDelete(task.id);
      onOpenChange(false);
    } catch {
      /* keep panel open */
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {task ? (
          <>
            <SheetHeader className="border-b border-border/50 pb-4 text-left">
              <SheetTitle className="sr-only">Task details</SheetTitle>
              {mode === "view" ? (
                <h2 className="pr-8 text-xl font-semibold leading-snug text-foreground">
                  {task.title}
                </h2>
              ) : (
                <div className="pr-8">
                  <label htmlFor="edit-title" className="sr-only">
                    Title
                  </label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-base font-semibold"
                  />
                </div>
              )}
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 p-4">
              {mode === "view" ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn("border", STATUS_BADGE[task.status])}
                    >
                      {statusLabel(task.status)}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {task.priority} priority
                    </Badge>
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Labels
                      </p>
                      <LabelManager
                        labels={allLabels}
                        loading={labelsLoading}
                        onCreateLabel={createLabel}
                        onDeleteLabel={deleteLabel}
                        onAfterLabelDelete={onTasksRefetch}
                      />
                    </div>
                    {task.labels && task.labels.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {task.labels.map((label) => (
                          <span
                            key={label.id}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              labelColorClass(label.color),
                            )}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No labels</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Assignees
                    </p>
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex flex-row flex-wrap gap-x-3 gap-y-2">
                        {task.assignees.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none",
                                labelColorClass(m.color),
                              )}
                              aria-hidden
                            >
                              {memberInitials(m.name)}
                            </span>
                            <span className="min-w-0 truncate text-sm text-foreground/90">
                              {m.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No assignees
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {task.description?.trim()
                        ? task.description
                        : "No description"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Due date
                    </p>
                    <p className="text-sm text-foreground/90">
                      {formatDueDateLong(task.due_date)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Created
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(task.created_at)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium">Description</span>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="min-h-[5rem] resize-y"
                    />
                  </div>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium">Priority</span>
                    <Select
                      value={priority}
                      onValueChange={(v) => setPriority(v as TaskPriority)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-due" className="text-sm font-medium">
                      Due date
                    </label>
                    <Input
                      id="edit-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium">Status</span>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as TaskStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMNS.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">Labels</span>
                      <LabelManager
                        labels={allLabels}
                        loading={labelsLoading}
                        onCreateLabel={createLabel}
                        onDeleteLabel={deleteLabel}
                        onAfterLabelDelete={onTasksRefetch}
                      />
                    </div>
                    <LabelPicker
                      taskId={task.id}
                      assigned={task.labels ?? []}
                      available={allLabels}
                      onAddToTask={addLabelToTask}
                      onRemoveFromTask={removeLabelFromTask}
                      onAssignmentsChange={onTasksRefetch}
                      disabled={saving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium">Assignees</span>
                    <AssigneePicker
                      taskId={task.id}
                      assigned={task.assignees ?? []}
                      available={allTeamMembers}
                      onAssign={assignMember}
                      onUnassign={unassignMember}
                      disabled={saving}
                    />
                  </div>
                </>
              )}
            </div>

            <SheetFooter className="mt-auto border-t border-border/50">
              {mode === "view" ? (
                <div className="flex w-full flex-col gap-3">
                  {deleteConfirm ? (
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                      <p className="mb-3 text-sm text-foreground">Are you sure?</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deleting}
                          onClick={() => void handleConfirmDelete()}
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Yes, delete"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deleting}
                          onClick={() => setDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setMode("edit")}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setDeleteConfirm(true)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex w-full gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                    onClick={discardEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={saving || !title.trim()}
                    onClick={() => void handleSave()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              )}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
