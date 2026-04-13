"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Label } from "@/types";

/** Shared label CRUD + list; pass one `useLabels()` result from Board so filter bar and task sheet stay in sync. */
export interface LabelsStore {
  labels: Label[];
  loading: boolean;
  refetch: () => Promise<void>;
  createLabel: (
    name: string,
    color: string,
    options?: { skipRefetch?: boolean },
  ) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  addLabelToTask: (taskId: string, labelId: string) => Promise<void>;
  removeLabelFromTask: (taskId: string, labelId: string) => Promise<void>;
}

async function fetchLabelsForUser(
  userId: string,
): Promise<{ labels: Label[]; error: string | null }> {
  const { data, error } = await supabase
    .from("labels")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) return { labels: [], error: error.message };
  return { labels: (data ?? []) as Label[], error: null };
}

export function useLabels() {
  const { user, loading: authLoading } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { labels: next, error } = await fetchLabelsForUser(user.id);
    setLoading(false);
    if (error) {
      toast.error("Failed to load labels", { description: error });
      setLabels([]);
      return;
    }
    setLabels(next);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    startTransition(() => {
      void refetch();
    });
  }, [user, authLoading, refetch]);

  const createLabel = useCallback(
    async (
      name: string,
      color: string,
      options?: { skipRefetch?: boolean },
    ) => {
      if (!user?.id) {
        toast.error("You must be signed in to create labels.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase.from("labels").insert({
        name: name.trim(),
        color,
        user_id: user.id,
      });
      if (error) {
        toast.error("Failed to create label", { description: error.message });
        throw new Error(error.message);
      }
      if (!options?.skipRefetch) await refetch();
    },
    [user, refetch],
  );

  const deleteLabel = useCallback(
    async (id: string) => {
      if (!user?.id) {
        toast.error("You must be signed in to delete labels.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase
        .from("labels")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        toast.error("Failed to delete label", { description: error.message });
        throw new Error(error.message);
      }
      await refetch();
    },
    [user, refetch],
  );

  /** After success, refetch tasks (e.g. `useTasks().refetch`) so joined `task.labels` updates. */
  const addLabelToTask = useCallback(
    async (taskId: string, labelId: string) => {
      if (!user?.id) {
        toast.error("You must be signed in.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase.from("task_labels").insert({
        task_id: taskId,
        label_id: labelId,
      });
      if (error) {
        toast.error("Failed to add label to task", { description: error.message });
        throw new Error(error.message);
      }
    },
    [user],
  );

  const removeLabelFromTask = useCallback(
    async (taskId: string, labelId: string) => {
      if (!user?.id) {
        toast.error("You must be signed in.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase
        .from("task_labels")
        .delete()
        .eq("task_id", taskId)
        .eq("label_id", labelId);
      if (error) {
        toast.error("Failed to remove label from task", {
          description: error.message,
        });
        throw new Error(error.message);
      }
    },
    [user],
  );

  const labelsLoading = authLoading || loading;

  const store: LabelsStore = {
    labels: user?.id ? labels : [],
    loading: labelsLoading,
    refetch,
    createLabel,
    deleteLabel,
    addLabelToTask,
    removeLabelFromTask,
  };
  return store;
}
