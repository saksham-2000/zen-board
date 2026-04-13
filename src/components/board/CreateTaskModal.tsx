"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { labelColorClass } from "@/lib/label-colors";
import {
  memberInitials,
  teamMemberAccentColor,
} from "@/lib/team-member-utils";
import { cn } from "@/lib/utils";
import type { Label, TaskPriority, TaskStatus, TeamMember } from "@/types";

function defaultDueDateOneWeekOut(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export interface CreateTaskSubmitData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  status: TaskStatus;
  /** Member ids to link after the task row exists. */
  assigneeIds?: string[];
  /** Label ids to link after the task row exists. */
  labelIds?: string[];
}

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: TaskStatus;
  onSubmit: (data: CreateTaskSubmitData) => Promise<void>;
  teamMembers: TeamMember[];
  labels: Label[];
}

export function CreateTaskModal({
  open,
  onOpenChange,
  defaultStatus,
  onSubmit,
  teamMembers,
  labels,
}: CreateTaskModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [submitting, setSubmitting] = useState(false);

  const clearForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority("normal");
    setDueDate("");
    setSelectedAssigneeIds(new Set());
    setSelectedLabelIds(new Set());
  }, []);

  const toggleAssignee = useCallback((id: string) => {
    setSelectedAssigneeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleLabel = useCallback((id: string) => {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) clearForm();
  }, [open, clearForm]);

  useEffect(() => {
    if (!open) return;
    setDueDate(defaultDueDateOneWeekOut());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const canSubmit = title.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const assigneeIds =
        selectedAssigneeIds.size > 0 ? [...selectedAssigneeIds] : undefined;
      const labelIds =
        selectedLabelIds.size > 0 ? [...selectedLabelIds] : undefined;
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        status: defaultStatus ?? "todo",
        assigneeIds,
        labelIds,
      });
      clearForm();
      onOpenChange(false);
    } catch {
      /* Parent may toast; keep modal open and form as-is */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            New task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              ref={titleRef}
              id="task-title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder="What needs to be done?"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="task-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={3}
              className="min-h-[4.5rem] resize-y"
              placeholder="Optional details…"
            />
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Priority</span>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="task-due" className="text-sm font-medium">
              Due date
            </label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(ev) => setDueDate(ev.target.value)}
            />
          </div>
          {labels.length > 0 ? (
            <div className="grid gap-2">
              <span className="text-sm font-medium">Labels</span>
              {/* <p className="text-xs text-muted-foreground">
                Optional — tag this task for filters.
              </p> */}
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Select labels"
              >
                {labels.map((label) => {
                  const on = selectedLabelIds.has(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      disabled={submitting}
                      className={cn(
                        "inline-flex h-auto min-h-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                        labelColorClass(label.color),
                        on
                          ? "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
                          : "opacity-80 hover:opacity-100",
                      )}
                      aria-pressed={on}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {teamMembers.length > 0 ? (
            <div className="grid gap-2">
              <span className="text-sm font-medium">Assignees</span>
              {/* <p className="text-xs text-muted-foreground">
                Optional — select who owns this task.
              </p> */}
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Select assignees"
              >
                {teamMembers.map((member) => {
                  const on = selectedAssigneeIds.has(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      disabled={submitting}
                      className={cn(
                        "inline-flex h-auto min-h-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                        labelColorClass(teamMemberAccentColor(member)),
                        on
                          ? "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
                          : "opacity-80 hover:opacity-100",
                      )}
                      aria-pressed={on}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border border-foreground/15 bg-background/35 text-[9px] font-semibold leading-none text-foreground",
                        )}
                      >
                        {memberInitials(member.name)}
                      </span>
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
