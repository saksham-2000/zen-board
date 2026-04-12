"use client";

import { Button } from "@/components/ui/button";
import { labelColorClass } from "@/lib/label-colors";
import { cn } from "@/lib/utils";
import type { Label } from "@/types";

export interface LabelFilterBarProps {
  labels: Label[];
  /** Label ids currently used to filter the board (OR semantics). */
  selectedLabelIds: readonly string[];
  onToggleLabel: (labelId: string) => void;
  onClearFilters: () => void;
}

export function LabelFilterBar({
  labels,
  selectedLabelIds,
  onToggleLabel,
  onClearFilters,
}: LabelFilterBarProps) {
  const selected = new Set(selectedLabelIds);
  const hasActiveFilters = selectedLabelIds.length > 0;

  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Filter
      </span>
      {labels.map((label) => {
        const isActive = selected.has(label.id);
        return (
          <button
            key={label.id}
            type="button"
            onClick={() => onToggleLabel(label.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-[box-shadow,opacity,transform]",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              isActive
                ? cn(labelColorClass(label.color), "shadow-sm")
                : "border border-dashed border-border/80 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground",
            )}
            aria-pressed={isActive}
          >
            {label.name}
          </button>
        );
      })}
      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
