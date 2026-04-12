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
import type { TaskPriority, TaskStatus } from "@/types";

export interface CreateTaskSubmitData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  status: TaskStatus;
}

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: TaskStatus;
  onSubmit: (data: CreateTaskSubmitData) => Promise<void>;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  defaultStatus,
  onSubmit,
}: CreateTaskModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const clearForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority("normal");
    setDueDate("");
  }, []);

  useEffect(() => {
    if (!open) clearForm();
  }, [open, clearForm]);

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
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        status: defaultStatus ?? "todo",
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
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
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
