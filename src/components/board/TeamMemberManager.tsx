"use client";

import { UsersIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamMembersStore } from "@/hooks/use-team-members";
import { labelColorClass, randomLabelColor } from "@/lib/label-colors";
import {
  memberInitials,
  teamMemberAccentColor,
} from "@/lib/team-member-utils";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/types";

interface TeamMemberManagerProps {
  teamMembersStore: TeamMembersStore;
  /** After a member is removed, refresh tasks so `task.assignees` drops stale rows. */
  onAfterMemberDelete?: () => void | Promise<void>;
}

export function TeamMemberManager({
  teamMembersStore,
  onAfterMemberDelete,
}: TeamMemberManagerProps) {
  const { members, loading, createMember, deleteMember } = teamMembersStore;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteInFlightRef = useRef(false);

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const handleAdd = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    try {
      await createMember(trimmed, randomLabelColor());
      setName("");
    } finally {
      setAdding(false);
    }
  }, [name, adding, createMember]);

  const handleDelete = useCallback(
    async (member: TeamMember) => {
      if (deleteInFlightRef.current) return;
      deleteInFlightRef.current = true;
      setDeletingId(member.id);
      try {
        await deleteMember(member.id);
        await onAfterMemberDelete?.();
      } finally {
        deleteInFlightRef.current = false;
        setDeletingId(null);
      }
    },
    [deleteMember, onAfterMemberDelete],
  );

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-xs"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <UsersIcon className="size-3.5" aria-hidden />
        Manage Team
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[80] cursor-default bg-transparent"
            aria-label="Close team manager"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-[90] mt-1 w-[min(100vw-2rem,18rem)] rounded-lg border border-border/60 bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Your team
            </p>
            <div className="mb-3 max-h-44 space-y-1.5 overflow-y-auto">
              {loading ? (
                <>
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </>
              ) : members.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">No members yet</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none",
                          labelColorClass(teamMemberAccentColor(member)),
                        )}
                        aria-hidden
                      >
                        {memberInitials(member.name)}
                      </span>
                      <span className="min-w-0 truncate text-xs font-medium text-foreground">
                        {member.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === member.id}
                      aria-label={`Remove ${member.name}`}
                      onClick={() => void handleDelete(member)}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border/50 pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Add member
              </p>
              <div className="flex flex-col gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAdd();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 w-full"
                  disabled={adding || !name.trim()}
                  onClick={() => void handleAdd()}
                >
                  {adding ? "Adding…" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
