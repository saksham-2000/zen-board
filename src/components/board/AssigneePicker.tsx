"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { labelColorClass } from "@/lib/label-colors";
import { memberInitials } from "@/lib/team-member-utils";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/types";

interface AssigneePickerProps {
  taskId: string;
  assigned: TeamMember[];
  available: TeamMember[];
  onAssign: (taskId: string, memberId: string) => Promise<void>;
  onUnassign: (taskId: string, memberId: string) => Promise<void>;
  disabled?: boolean;
}

export function AssigneePicker({
  taskId,
  assigned,
  available,
  onAssign,
  onUnassign,
  disabled,
}: AssigneePickerProps) {
  const assignedIds = useMemo(
    () => new Set(assigned.map((m) => m.id)),
    [assigned],
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = useCallback(
    async (memberId: string) => {
      if (disabled || busyId) return;
      const isOn = assignedIds.has(memberId);
      setBusyId(memberId);
      try {
        if (isOn) await onUnassign(taskId, memberId);
        else await onAssign(taskId, memberId);
      } finally {
        setBusyId(null);
      }
    },
    [
      assignedIds,
      busyId,
      disabled,
      onAssign,
      onUnassign,
      taskId,
    ],
  );

  if (available.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No team members yet — use Team to add people.
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Toggle assignees for this task"
    >
      {available.map((member) => {
        const on = assignedIds.has(member.id);
        const busy = busyId === member.id;
        return (
          <Button
            key={member.id}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || Boolean(busyId)}
            className={cn(
              "h-auto min-h-0 gap-1.5 rounded-full border px-2 py-1 text-xs font-medium",
              labelColorClass(member.color),
              on && "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background",
              !on && "opacity-80 hover:opacity-100",
            )}
            aria-pressed={on}
            onClick={() => void toggle(member.id)}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold leading-none",
                "border border-foreground/10 bg-background/40",
              )}
            >
              {memberInitials(member.name)}
            </span>
            {busy ? "…" : member.name}
          </Button>
        );
      })}
    </div>
  );
}
