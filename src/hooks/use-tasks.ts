"use client";

// Manages task CRUD against Supabase. Refetches after mutations for simplicity — optimistic updates added later for drag-and-drop.

import { startTransition, useCallback, useEffect, useState } from "react";
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

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const { tasks: next, error: fetchError } = await fetchTasks(user.id);
    setLoading(false);
    if (fetchError) {
      setError(fetchError);
      setTasks([]);
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
        setError("Not signed in");
        return;
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
        throw new Error(insertError.message);
      }
      await refetch();
    },
    [user, refetch],
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (!user?.id) {
        setError("Not signed in");
        return;
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
        return;
      }
      await refetch();
    },
    [user, refetch],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!user?.id) {
        setError("Not signed in");
        return;
      }
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
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
    deleteTask,
  };
}
