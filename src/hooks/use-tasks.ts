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
import type { Task, TaskPriority, TaskStatus } from "@/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  status?: TaskStatus;
}

async function fetchTasks(userId: string): Promise<{ tasks: Task[]; error: string | null }> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return { tasks: [], error: error.message };
  return { tasks: (data ?? []) as Task[], error: null };
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

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const { tasks: next, error: fetchError } = await fetchTasks(user.id);
    setLoading(false);
    if (fetchError) {
      setError(fetchError);
      setTasks([]);
      toast.error("Failed to load tasks", { description: fetchError });
      return;
    }
    setTasks(next);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    startTransition(() => {
      void refetch();
    });
  }, [user, authLoading, refetch]);

  const createTask = useCallback(
    async (data: CreateTaskInput) => {
      if (!user?.id) {
        const msg = "You must be signed in to create tasks.";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      const row: {
        user_id: string;
        title: string;
        description?: string;
        priority?: TaskPriority;
        due_date?: string | null;
        status?: TaskStatus;
      } = { user_id: user.id, title: data.title };
      if (data.description !== undefined) row.description = data.description;
      if (data.priority !== undefined) row.priority = data.priority;
      if (data.due_date !== undefined) row.due_date = data.due_date;
      if (data.status !== undefined) row.status = data.status;

      const { error: insertError } = await supabase.from("tasks").insert(row);
      if (insertError) {
        setError(insertError.message);
        toast.error("Failed to create task", { description: insertError.message });
        throw new Error(insertError.message);
      }
      await refetch();
    },
    [user, refetch],
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (!user?.id) {
        const msg = "You must be signed in to update tasks.";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      const { id: _i, user_id: _u, created_at: _c, ...columns } = updates;
      void _i;
      void _u;
      void _c;
      if (Object.keys(columns).length === 0) return;

      const { error: updateError } = await supabase
        .from("tasks")
        .update(columns)
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        setError(updateError.message);
        toast.error("Failed to update task", { description: updateError.message });
        throw new Error(updateError.message);
      }
      await refetch();
    },
    [user, refetch],
  );

  // Optimistic update for drag-and-drop — updates UI instantly, reverts on failure.
  const moveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      if (!user?.id) {
        const msg = "You must be signed in to move tasks.";
        setError(msg);
        toast.error(msg);
        return;
      }

      const prev = tasksRef.current;
      const task = prev.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      const snapshot = prev;

      setTasks(
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t,
        ),
      );

      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (updateError) {
        setError(updateError.message);
        setTasks(snapshot);
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
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  };
}
