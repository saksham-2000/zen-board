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
import { startTransition, useCallback, useMemo, useState } from "react";
import { Column } from "./Column";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskCard } from "./TaskCard";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { COLUMNS } from "@/lib/constants";
import { useTasks } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@/types";

const COLUMN_IDS = new Set<TaskStatus>(COLUMNS.map((c) => c.id));

function isColumnId(id: string | number): id is TaskStatus {
  return COLUMN_IDS.has(id as TaskStatus);
}

export function Board() {
  const { tasks, loading, error, createTask, moveTask, updateTask, deleteTask } =
    useTasks();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>("todo");
  const [dragActiveTask, setDragActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Keep panel in sync with refetched rows (selectedTask is a stale snapshot from the card click).
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

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const task of tasks) {
      const list = map.get(task.status);
      if (list) list.push(task);
    }
    return map;
  }, [tasks]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setDragActiveTask(tasks.find((t) => t.id === id) ?? null);
    },
    [tasks],
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
        Loading board…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="min-h-0 flex-1 overflow-x-auto px-4 md:px-6">
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
        <DragOverlay dropAnimation={null}>
          {dragActiveTask ? <TaskCard task={dragActiveTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
      <TaskDetailPanel
        task={panelTask}
        open={selectedTask !== null}
        onOpenChange={handleDetailOpenChange}
        onUpdate={updateTask}
        onDelete={deleteTask}
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
    </div>
  );
}
