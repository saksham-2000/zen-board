"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Column } from "./Column";
import { CreateTaskModal } from "./CreateTaskModal";
import { BoardStats } from "./BoardStats";
import { FilterBar, type BoardPriorityFilter } from "./FilterBar";
import { TaskCard } from "./TaskCard";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabels } from "@/hooks/use-labels";
import { COLUMNS } from "@/lib/constants";
import { useTasks } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@/types";

const COLUMN_IDS = new Set<TaskStatus>(COLUMNS.map((c) => c.id));

function isColumnId(id: string | number): id is TaskStatus {
  return COLUMN_IDS.has(id as TaskStatus);
}

function BoardColumnSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-[290px] shrink-0 flex-col rounded-xl bg-slate-50/90 dark:bg-slate-950/35">
      <header className="border-l-[3px] border-solid border-l-slate-400/40 px-3 pb-2 pt-3">
        <Skeleton className="h-4 w-28 rounded-md" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-3 pt-1">
        <Skeleton className="h-20 w-full shrink-0 rounded-lg" />
        <Skeleton className="h-20 w-full shrink-0 rounded-lg" />
        <Skeleton className="h-20 w-full shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

function BoardChrome({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}

export function Board() {
  const {
    tasks,
    loading,
    error,
    refetch,
    createTask,
    moveTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const labelsStore = useLabels();
  const { labels: boardLabels } = labelsStore;
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>("todo");
  const [dragActiveTask, setDragActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedLabelFilterIds, setSelectedLabelFilterIds] = useState<string[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState<BoardPriorityFilter>("all");

  const panelTask = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find((t) => t.id === selectedTask.id) ?? selectedTask;
  }, [selectedTask, tasks]);

  const handleDetailOpenChange = useCallback((next: boolean) => {
    if (!next) {
      startTransition(() => setSelectedTask(null));
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function openCreateModal(status: TaskStatus) {
    setCreateDefaultStatus(status);
    setCreateOpen(true);
  }

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (q && !task.title.toLowerCase().includes(q)) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;
      if (selectedLabelFilterIds.length > 0) {
        const wanted = new Set(selectedLabelFilterIds);
        const onTask = task.labels?.map((l) => l.id) ?? [];
        if (!onTask.some((id) => wanted.has(id))) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, selectedLabelFilterIds]);

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const task of filteredTasks) {
      const list = map.get(task.status);
      if (list) list.push(task);
    }
    return map;
  }, [filteredTasks]);

  const toggleLabelFilter = useCallback((labelId: string) => {
    setSelectedLabelFilterIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  }, []);

  const clearAllBoardFilters = useCallback(() => {
    setSearchQuery("");
    setPriorityFilter("all");
    setSelectedLabelFilterIds([]);
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setDragActiveTask(filteredTasks.find((t) => t.id === id) ?? null);
    },
    [filteredTasks],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    void event;
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragActiveTask(null);
      const { active, over } = event;
      if (!over) return;
      const taskId = String(active.id);
      if (!isColumnId(over.id)) return;
      void moveTask(taskId, over.id);
    },
    [moveTask],
  );

  const handleDragCancel = useCallback(() => {
    setDragActiveTask(null);
  }, []);

  const overlays = (
    <>
      <TaskDetailPanel
        task={panelTask}
        open={selectedTask !== null}
        onOpenChange={handleDetailOpenChange}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onTasksRefetch={() => void refetch()}
        labelsStore={labelsStore}
      />
      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus={createDefaultStatus}
        onSubmit={async (data) => {
          await createTask({
            title: data.title,
            description: data.description,
            priority: data.priority,
            due_date: data.due_date,
            status: data.status,
          });
        }}
      />
    </>
  );

  if (loading) {
    return (
      <BoardChrome>
        <div className="min-h-0 flex-1 overflow-x-auto px-4 md:px-6">
          <div className="flex h-full min-h-0 gap-6 pb-4">
            {COLUMNS.map((col) => (
              <BoardColumnSkeleton key={col.id} />
            ))}
          </div>
        </div>
        {overlays}
      </BoardChrome>
    );
  }

  if (error) {
    return (
      <BoardChrome>
        <div className="flex flex-1 items-center justify-center px-4 text-sm text-destructive">
          {error}
        </div>
        {overlays}
      </BoardChrome>
    );
  }

  if (tasks.length === 0) {
    return (
      <BoardChrome>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Create your first task to get started
          </p>
          <Button type="button" onClick={() => openCreateModal("todo")}>
            Create task
          </Button>
        </div>
        {overlays}
      </BoardChrome>
    );
  }

  return (
    <BoardChrome>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 md:px-6">
          <BoardStats tasks={tasks} />
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            labels={boardLabels}
            selectedLabelIds={selectedLabelFilterIds}
            onToggleLabel={toggleLabelFilter}
            onClearAll={clearAllBoardFilters}
            visibleTaskCount={filteredTasks.length}
            totalTaskCount={tasks.length}
          />
          <div className="min-h-0 flex-1 overflow-x-auto">
            <div className="flex h-full min-h-0 gap-6 pb-4">
              {COLUMNS.map((col) => (
                <Column
                  key={col.id}
                  status={col.id}
                  title={col.label}
                  tasks={byStatus.get(col.id) ?? []}
                  onAddClick={() => openCreateModal(col.id)}
                  onTaskClick={setSelectedTask}
                />
              ))}
            </div>
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragActiveTask ? <TaskCard task={dragActiveTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
      {overlays}
    </BoardChrome>
  );
}
