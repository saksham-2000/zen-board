"use client";

import { TagIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { labelColorClass, randomLabelColor } from "@/lib/label-colors";
import { cn } from "@/lib/utils";
import type { Label } from "@/types";

interface LabelManagerProps {
  labels: Label[];
  loading: boolean;
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onDeleteLabel: (id: string) => Promise<void>;
  /** After a label is removed from the DB, refresh tasks so `task.labels` drops stale rows. */
  onAfterLabelDelete?: () => void | Promise<void>;
}

export function LabelManager({
  labels,
  loading,
  onCreateLabel,
  onDeleteLabel,
  onAfterLabelDelete,
}: LabelManagerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [labelPendingDelete, setLabelPendingDelete] = useState<Label | null>(
    null,
  );
  const deleteInFlightRef = useRef(false);

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const handleAdd = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    try {
      await onCreateLabel(trimmed, randomLabelColor());
      setName("");
    } finally {
      setAdding(false);
    }
  }, [name, adding, onCreateLabel]);

  const confirmDeleteOpen = labelPendingDelete !== null;

  const handleConfirmDelete = useCallback(async () => {
    if (!labelPendingDelete || deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    const id = labelPendingDelete.id;
    setDeletingId(id);
    try {
      await onDeleteLabel(id);
      await onAfterLabelDelete?.();
      setLabelPendingDelete(null);
    } finally {
      deleteInFlightRef.current = false;
      setDeletingId(null);
    }
  }, [labelPendingDelete, onDeleteLabel, onAfterLabelDelete]);

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
        <TagIcon className="size-3.5" aria-hidden />
        Manage Labels
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[80] cursor-default bg-transparent"
            aria-label="Close label manager"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-[90] mt-1 w-[min(100vw-2rem,18rem)] rounded-lg border border-border/60 bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Your labels
            </p>
            <div className="mb-3 max-h-40 space-y-1.5 overflow-y-auto">
              {loading ? (
                <>
                  <Skeleton className="h-7 w-full rounded-md" />
                  <Skeleton className="h-7 w-full rounded-md" />
                </>
              ) : labels.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">No labels yet</p>
              ) : (
                labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1"
                  >
                    <span
                      className={cn(
                        "min-w-0 truncate rounded-md px-2 py-0.5 text-xs font-medium",
                        labelColorClass(label.color),
                      )}
                    >
                      {label.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === label.id}
                      aria-label={`Delete label ${label.name}`}
                      onClick={() => setLabelPendingDelete(label)}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border/50 pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Add label
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

      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(next) => {
          if (!next) setLabelPendingDelete(null);
        }}
      >
        <DialogContent
          overlayClassName="z-[200]"
          className="z-[200] md:max-w-md"
          showCloseButton={!deletingId}
          onPointerDownOutside={(e) => {
            if (deletingId) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (deletingId) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete this label?</DialogTitle>
            <DialogDescription>
              &quot;{labelPendingDelete?.name}&quot; will be removed from every
              task that uses it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(deletingId)}
              onClick={() => setLabelPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={() => void handleConfirmDelete()}
            >
              {deletingId ? "Deleting…" : "Delete label"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
