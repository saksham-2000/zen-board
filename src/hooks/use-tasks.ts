"use client";

// Manages task CRUD against Supabase. Refetches after mutations for simplicity — optimistic updates added later for drag-and-drop.

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Label, Task, TaskPriority, TaskStatus, TeamMember } from "@/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  status?: TaskStatus;
}

interface TaskLabelJoinRow {
  label_id: string;
  labels: Label | null;
}

interface TaskAssigneeJoinRow {
  member_id: string;
  team_members: TeamMember | null;
}

interface TaskRowFromDb {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  user_id: string;
  created_at: string;
  board_position: number | null;
  task_labels: TaskLabelJoinRow[] | null;
  task_assignees: TaskAssigneeJoinRow[] | null;
}

function mapTaskRow(row: TaskRowFromDb): Task {
  const { task_labels, task_assignees, board_position, ...rest } = row;
  const labels = (task_labels ?? [])
    .map((tl) => tl.labels)
    .filter((l): l is Label => l != null);
  const assignees = (task_assignees ?? [])
    .map((ta) => ta.team_members)
    .filter((m): m is TeamMember => m != null);

  let task: Task = {
    ...rest,
    board_position: board_position ?? 0,
  };
  if (labels.length > 0) task = { ...task, labels };
  if (assignees.length > 0) task = { ...task, assignees };
  return task;
}

async function fetchTasks(userId: string): Promise<{ tasks: Task[]; error: string | null }> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "*, task_labels(label_id, labels(*)), task_assignees(member_id, team_members(*))",
    )
    .eq("user_id", userId)
    .order("board_position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { tasks: [], error: error.message };
  const rows = (data ?? []) as TaskRowFromDb[];
  return { tasks: rows.map(mapTaskRow), error: null };
}

export function useTasks() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user?.id) return;
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const { tasks: next, error: fetchError } = await fetchTasks(user.id);
      if (!silent) setLoading(false);
      if (fetchError) {
        setError(fetchError);
        setTasks([]);
        toast.error("Failed to load tasks", { description: fetchError });
        return;
      }
      setTasks(next);
    },
    [user],
  );

  useEffect(() => {
    if (authLoading || !user?.id) return;
    startTransition(() => {
      void refetch();
    });
  }, [user, authLoading, refetch]);

  const createTask = useCallback(
    async (
      data: CreateTaskInput,
      options?: { skipRefetch?: boolean },
    ): Promise<string> => {
      if (!user?.id) {
        const msg = "You must be signed in to create tasks.";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      const status = data.status ?? "todo";
      const siblings = tasksRef.current.filter((t) => t.status === status);
      const maxPos = siblings.reduce(
        (m, t) => Math.max(m, t.board_position ?? 0),
        -1,
      );

      const row: {
        user_id: string;
        title: string;
        board_position: number;
        description?: string;
        priority?: TaskPriority;
        due_date?: string | null;
        status?: TaskStatus;
      } = {
        user_id: user.id,
        title: data.title,
        board_position: maxPos + 1,
        status,
      };
      if (data.description !== undefined) row.description = data.description;
      if (data.priority !== undefined) row.priority = data.priority;
      if (data.due_date !== undefined) row.due_date = data.due_date;

      const { data: inserted, error: insertError } = await supabase
        .from("tasks")
        .insert(row)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        toast.error("Failed to create task", { description: insertError.message });
        throw new Error(insertError.message);
      }
      if (!options?.skipRefetch) await refetch();
      return inserted.id as string;
    },
    [user, refetch],
  );

  const updateTask = useCallback(
    async (
      id: string,
      updates: Partial<Task>,
      options?: { skipRefetch?: boolean },
    ) => {
      if (!user?.id) {
        const msg = "You must be signed in to update tasks.";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      const {
        id: _i,
        user_id: _u,
        created_at: _c,
        labels: _labels,
        assignees: _assignees,
        ...columns
      } = updates;
      void _i;
      void _u;
      void _c;
      void _labels;
      void _assignees;
      if (Object.keys(columns).length === 0) return;

      const existing = tasksRef.current.find((t) => t.id === id);
      let columnsToSend: Record<string, unknown> = { ...columns };
      if (
        existing &&
        columns.status !== undefined &&
        columns.status !== existing.status
      ) {
        const siblings = tasksRef.current.filter(
          (t) => t.status === columns.status && t.id !== id,
        );
        const maxPos = siblings.reduce(
          (m, t) => Math.max(m, t.board_position ?? 0),
          -1,
        );
        columnsToSend = { ...columnsToSend, board_position: maxPos + 1 };
      }

      const { error: updateError } = await supabase
        .from("tasks")
        .update(columnsToSend)
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        setError(updateError.message);
        toast.error("Failed to update task", { description: updateError.message });
        throw new Error(updateError.message);
      }
      if (!options?.skipRefetch) await refetch();
    },
    [user, refetch],
  );

  /** Applies a full board order (status + `board_position`) from drag-and-drop. */
  const commitBoardOrder = useCallback(
    async (nextTasks: Task[]) => {
      if (!user?.id) {
        const msg = "You must be signed in to move tasks.";
        setError(msg);
        toast.error(msg);
        return;
      }

      const prev = tasksRef.current;
      const changed = nextTasks.filter((t) => {
        const o = prev.find((p) => p.id === t.id);
        return (
          !o ||
          o.status !== t.status ||
          (o.board_position ?? 0) !== (t.board_position ?? 0)
        );
      });
      if (changed.length === 0) return;

      setTasks(nextTasks);

      const results = await Promise.all(
        changed.map((t) =>
          supabase
            .from("tasks")
            .update({
              status: t.status,
              board_position: t.board_position ?? 0,
            })
            .eq("id", t.id)
            .eq("user_id", user.id),
        ),
      );

      const updateError = results.find((r) => r.error)?.error;
      if (updateError) {
        setError(updateError.message);
        setTasks(prev);
        toast.error("Failed to move task", { description: updateError.message });
        return;
      }

      setError(null);
    },
    [user],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!user?.id) {
        const msg = "You must be signed in to delete tasks.";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        toast.error("Failed to delete task", { description: deleteError.message });
        throw new Error(deleteError.message);
      }
      await refetch();
    },
    [user, refetch],
  );

  const tasksLoading = authLoading || loading;

  return {
    tasks: user?.id ? tasks : [],
    loading: tasksLoading,
    error: user?.id ? error : null,
    refetch,
    createTask,
    updateTask,
    commitBoardOrder,
    deleteTask,
  };
}
