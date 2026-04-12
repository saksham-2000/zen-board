"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { labelColorClass } from "@/lib/label-colors";
import { cn } from "@/lib/utils";
import type { Label } from "@/types";

interface LabelPickerProps {
  taskId: string;
  /** Labels currently on the task (from `task.labels`). */
  assigned: Label[];
  /** All labels the user can assign. */
  available: Label[];
  onAddToTask: (taskId: string, labelId: string) => Promise<void>;
  onRemoveFromTask: (taskId: string, labelId: string) => Promise<void>;
  onAssignmentsChange?: () => void | Promise<void>;
  disabled?: boolean;
}

export function LabelPicker({
  taskId,
  assigned,
  available,
  onAddToTask,
  onRemoveFromTask,
  onAssignmentsChange,
  disabled,
}: LabelPickerProps) {
  const assignedIds = useMemo(
    () => new Set(assigned.map((l) => l.id)),
    [assigned],
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = useCallback(
    async (labelId: string) => {
      if (disabled || busyId) return;
      const isOn = assignedIds.has(labelId);
      setBusyId(labelId);
      try {
        if (isOn) await onRemoveFromTask(taskId, labelId);
        else await onAddToTask(taskId, labelId);
        await onAssignmentsChange?.();
      } finally {
        setBusyId(null);
      }
    },
    [
      assignedIds,
      busyId,
      disabled,
      onAddToTask,
      onRemoveFromTask,
      onAssignmentsChange,
      taskId,
    ],
  );

  if (available.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No labels yet — use Manage labels to create one.
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Toggle labels for this task"
    >
      {available.map((label) => {
        const on = assignedIds.has(label.id);
        const busy = busyId === label.id;
        return (
          <Button
            key={label.id}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || Boolean(busyId)}
            className={cn(
              "h-auto min-h-0 rounded-full border px-2.5 py-1 text-xs font-medium",
              labelColorClass(label.color),
              on && "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background",
              !on && "opacity-80 hover:opacity-100",
            )}
            aria-pressed={on}
            onClick={() => void toggle(label.id)}
          >
            {busy ? "…" : label.name}
          </Button>
        );
      })}
    </div>
  );
}
