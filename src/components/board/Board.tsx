"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import { LabelManager } from "./LabelManager";
import { TeamMemberManager } from "./TeamMemberManager";
import { FilterBar, type BoardPriorityFilter } from "./FilterBar";
import { TaskCard } from "./TaskCard";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useLabels } from "@/hooks/use-labels";
import { useTaskAssignees } from "@/hooks/use-task-assignees";
import { useTeamMembers } from "@/hooks/use-team-members";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import { COLUMNS } from "@/lib/constants";
import { useTasks } from "@/hooks/use-tasks";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const COLUMN_IDS = new Set<TaskStatus>(COLUMNS.map((c) => c.id));

function isColumnId(id: string | number): id is TaskStatus {
  return COLUMN_IDS.has(id as TaskStatus);
}

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };

function compareTasks(a: Task, b: Task): number {
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;
  return a.created_at.localeCompare(b.created_at);
}

function BoardHeader({ tasks }: { tasks: Task[] }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between md:gap-4">
      <h1 className="shrink-0 text-2xl font-semibold tracking-tight text-foreground">
        Zen Board
      </h1>
      <BoardStats tasks={tasks} />
    </header>
  );
}

function BoardColumnSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-[min(calc(100vw-2rem),280px)] min-w-[min(calc(100vw-2rem),280px)] shrink-0 flex-col rounded-xl border border-border/40 bg-muted/20 dark:bg-muted/10 max-md:snap-start md:w-56 md:min-w-56 lg:w-[280px] lg:min-w-[280px]">
      <header className="border-l-2 border-solid border-l-slate-400/45 px-3 pb-2 pt-3">
        <Skeleton className="h-4 w-28 rounded-md" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 pt-2">
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
  const teamMembersStore = useTeamMembers();
  const { user } = useAuth();
  useWorkspaceDefaults(user?.id, labelsStore, teamMembersStore);
  const { assignMember, unassignMember, assignMembersToTask } = useTaskAssignees(
    () => void refetch(),
  );
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
  const [assigneeFilterMemberId, setAssigneeFilterMemberId] = useState("");

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
      if (assigneeFilterMemberId) {
        const onTask = task.assignees?.map((a) => a.id) ?? [];
        if (!onTask.includes(assigneeFilterMemberId)) return false;
      }
      if (selectedLabelFilterIds.length > 0) {
        const wanted = new Set(selectedLabelFilterIds);
        const onTask = task.labels?.map((l) => l.id) ?? [];
        if (!onTask.some((id) => wanted.has(id))) return false;
      }
      return true;
    });
  }, [
    tasks,
    searchQuery,
    priorityFilter,
    assigneeFilterMemberId,
    selectedLabelFilterIds,
  ]);

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const task of filteredTasks) {
      const list = map.get(task.status);
      if (list) list.push(task);
    }
    for (const col of COLUMNS) map.get(col.id)!.sort(compareTasks);
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
    setAssigneeFilterMemberId("");
    setSelectedLabelFilterIds([]);
  }, []);

  const refetchTasksAfterMemberChange = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setDragActiveTask(filteredTasks.find((t) => t.id === id) ?? null);
    },
    [filteredTasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragActiveTask(null);
      const { active, over } = event;
      if (!over) return;
      const taskId = String(active.id);
      const overId = over.id;
      const targetColumn = isColumnId(overId)
        ? overId
        : tasks.find((t) => t.id === String(overId))?.status;
      if (!targetColumn) return;
      void moveTask(taskId, targetColumn);
    },
    [moveTask, tasks],
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
        onTasksRefetch={() => void refetch({ silent: true })}
        labelsStore={labelsStore}
        teamMembersStore={teamMembersStore}
        assignMember={assignMember}
        unassignMember={unassignMember}
      />
      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus={createDefaultStatus}
        teamMembers={teamMembersStore.members}
        labels={boardLabels}
        onSubmit={async (data) => {
          const taskId = await createTask(
            {
              title: data.title,
              description: data.description,
              priority: data.priority,
              due_date: data.due_date,
              status: data.status,
            },
            { skipRefetch: true },
          );
          if (data.labelIds?.length) {
            for (const labelId of data.labelIds) {
              await labelsStore.addLabelToTask(taskId, labelId);
            }
          }
          if (data.assigneeIds?.length) {
            await assignMembersToTask(taskId, data.assigneeIds, {
              skipRefetch: true,
            });
          }
          void refetch({ silent: true });
        }}
      />
    </>
  );

  if (loading) {
    return (
      <BoardChrome>
        <div className="shrink-0 px-4 pt-3 md:px-6">
          <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-8 w-44 rounded-md" />
            <Skeleton className="h-5 w-64 max-w-full rounded-md" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto overscroll-x-contain px-4 max-md:snap-x max-md:snap-mandatory md:px-6">
          <div className="flex h-full min-h-0 gap-3 pb-4 pt-3 md:gap-4">
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
        <div className="shrink-0 space-y-2 px-4 pt-3 md:px-6">
          <BoardHeader tasks={tasks} />
          <div className="flex flex-wrap items-center justify-end gap-2 py-2">
            <LabelManager
              labels={boardLabels}
              loading={labelsStore.loading}
              onCreateLabel={labelsStore.createLabel}
              onDeleteLabel={labelsStore.deleteLabel}
              onAfterLabelDelete={refetchTasksAfterMemberChange}
            />
            <TeamMemberManager
              teamMembersStore={teamMembersStore}
              onAfterMemberDelete={refetchTasksAfterMemberChange}
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-sm text-destructive">
          {error}
        </div>
        {overlays}
      </BoardChrome>
    );
  }

  if (tasks.length === 0) {
    return (
      <BoardChrome>
        <div className="shrink-0 space-y-2 px-4 pt-3 md:px-6">
          <BoardHeader tasks={tasks} />
          <div className="flex flex-wrap items-center justify-end gap-2 py-2">
            <LabelManager
              labels={boardLabels}
              loading={labelsStore.loading}
              onCreateLabel={labelsStore.createLabel}
              onDeleteLabel={labelsStore.deleteLabel}
              onAfterLabelDelete={refetchTasksAfterMemberChange}
            />
            <TeamMemberManager
              teamMembersStore={teamMembersStore}
              onAfterMemberDelete={refetchTasksAfterMemberChange}
            />
          </div>
        </div>
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
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-3 md:px-6">
          <BoardHeader tasks={tasks} />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 py-2">
            <LabelManager
              labels={boardLabels}
              loading={labelsStore.loading}
              onCreateLabel={labelsStore.createLabel}
              onDeleteLabel={labelsStore.deleteLabel}
              onAfterLabelDelete={refetchTasksAfterMemberChange}
            />
            <TeamMemberManager
              teamMembersStore={teamMembersStore}
              onAfterMemberDelete={refetchTasksAfterMemberChange}
            />
          </div>
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            teamMembers={teamMembersStore.members}
            assigneeFilterMemberId={assigneeFilterMemberId}
            onAssigneeFilterMemberIdChange={setAssigneeFilterMemberId}
            labels={boardLabels}
            selectedLabelIds={selectedLabelFilterIds}
            onToggleLabel={toggleLabelFilter}
            onClearAll={clearAllBoardFilters}
            visibleTaskCount={filteredTasks.length}
            totalTaskCount={tasks.length}
          />
          <div className="min-h-0 flex-1 overflow-x-auto overscroll-x-contain max-md:snap-x max-md:snap-mandatory">
            <div className="flex h-full min-h-0 gap-3 pb-4 pt-1 md:gap-4">
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
