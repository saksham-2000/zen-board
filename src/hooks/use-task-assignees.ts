"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

/**
 * Mutations on `task_assignees`. Call `refetchTasks` after success so `useTasks` picks up joined `assignees`.
 */
export function useTaskAssignees(refetchTasks: () => void | Promise<void>) {
  const { user } = useAuth();

  const assignMember = useCallback(
    async (taskId: string, memberId: string) => {
      if (!user?.id) {
        toast.error("You must be signed in.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase.from("task_assignees").insert({
        task_id: taskId,
        member_id: memberId,
      });
      if (error) {
        toast.error("Failed to assign member", { description: error.message });
        throw new Error(error.message);
      }
      await refetchTasks();
    },
    [user, refetchTasks],
  );

  const unassignMember = useCallback(
    async (taskId: string, memberId: string) => {
      if (!user?.id) {
        toast.error("You must be signed in.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId)
        .eq("member_id", memberId);
      if (error) {
        toast.error("Failed to unassign member", { description: error.message });
        throw new Error(error.message);
      }
      await refetchTasks();
    },
    [user, refetchTasks],
  );

  const assignMembersToTask = useCallback(
    async (taskId: string, memberIds: string[]) => {
      if (!user?.id) {
        toast.error("You must be signed in.");
        throw new Error("Not signed in");
      }
      if (memberIds.length === 0) return;
      const rows = memberIds.map((member_id) => ({ task_id: taskId, member_id }));
      const { error } = await supabase.from("task_assignees").insert(rows);
      if (error) {
        toast.error("Failed to assign members", { description: error.message });
        throw new Error(error.message);
      }
      await refetchTasks();
    },
    [user, refetchTasks],
  );

  return { assignMember, unassignMember, assignMembersToTask };
}
