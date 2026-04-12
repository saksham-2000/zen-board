"use client";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labelColorClass } from "@/lib/label-colors";
import { cn } from "@/lib/utils";
import type { Label, TaskPriority } from "@/types";

export type BoardPriorityFilter = "all" | TaskPriority;

const PRIORITY_SEGMENTS: { value: BoardPriorityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorityFilter: BoardPriorityFilter;
  onPriorityChange: (value: BoardPriorityFilter) => void;
  labels: Label[];
  selectedLabelIds: readonly string[];
  onToggleLabel: (labelId: string) => void;
  onClearAll: () => void;
  visibleTaskCount: number;
  totalTaskCount: number;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  labels,
  selectedLabelIds,
  onToggleLabel,
  onClearAll,
  visibleTaskCount,
  totalTaskCount,
}: FilterBarProps) {
  const selectedLabels = new Set(selectedLabelIds);
  const searchActive = searchQuery.trim().length > 0;
  const priorityActive = priorityFilter !== "all";
  const labelsActive = selectedLabelIds.length > 0;
  const anyFilterActive = searchActive || priorityActive || labelsActive;
  const isReduced = visibleTaskCount < totalTaskCount;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/40 pb-3">
      <div className="relative min-w-[min(100%,11rem)] max-w-sm flex-1">
        <SearchIcon
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search titles…"
          className="h-8 pl-8"
          aria-label="Filter tasks by title"
        />
      </div>

      <div
        className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted/30 p-0.5"
        role="group"
        aria-label="Filter by priority"
      >
        {PRIORITY_SEGMENTS.map(({ value, label }) => {
          const on = priorityFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onPriorityChange(value)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                on
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={on}
            >
              {label}
            </button>
          );
        })}
      </div>

      {labels.length > 0 ? (
        <>
          <div
            className="hidden h-6 w-px shrink-0 bg-border/60 sm:block"
            aria-hidden
          />
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="sr-only">Filter by label</span>
            {labels.map((label) => {
              const isActive = selectedLabels.has(label.id);
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
          </div>
        </>
      ) : null}

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
        {isReduced ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {visibleTaskCount} task{visibleTaskCount === 1 ? "" : "s"} shown
          </span>
        ) : null}
        {anyFilterActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={onClearAll}
          >
            Clear all
          </Button>
        ) : null}
      </div>
    </div>
  );
}
