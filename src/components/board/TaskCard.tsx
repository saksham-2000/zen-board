import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/types";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-rose-400/45",
  normal: "bg-sky-500/35",
  low: "bg-zinc-400/45",
};

function formatDueDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-0 border border-border/50 bg-card py-0 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-1.5 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className={cn(
              "mt-1.5 size-1.5 shrink-0 rounded-full",
              PRIORITY_DOT[task.priority],
            )}
          />
          <p className="min-w-0 flex-1 truncate font-medium leading-snug text-foreground/90">
            {task.title}
          </p>
        </div>
        {task.due_date ? (
          <p className="pl-3.5 text-xs text-muted-foreground">
            {formatDueDate(task.due_date)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
