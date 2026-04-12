"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/types";

/** Pass one `useTeamMembers()` result from Board so team UI stays in sync. */
export interface TeamMembersStore {
  members: TeamMember[];
  loading: boolean;
  refetch: () => Promise<void>;
  createMember: (name: string, color: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
}

async function fetchTeamMembersForUser(
  userId: string,
): Promise<{ members: TeamMember[]; error: string | null }> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) return { members: [], error: error.message };
  return { members: (data ?? []) as TeamMember[], error: null };
}

export function useTeamMembers(): TeamMembersStore {
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { members: next, error } = await fetchTeamMembersForUser(user.id);
    setLoading(false);
    if (error) {
      toast.error("Failed to load team members", { description: error });
      setMembers([]);
      return;
    }
    setMembers(next);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    startTransition(() => {
      void refetch();
    });
  }, [user, authLoading, refetch]);

  const createMember = useCallback(
    async (name: string, color: string) => {
      if (!user?.id) {
        toast.error("You must be signed in to add team members.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase.from("team_members").insert({
        name: name.trim(),
        color,
        user_id: user.id,
      });
      if (error) {
        toast.error("Failed to create team member", { description: error.message });
        throw new Error(error.message);
      }
      await refetch();
    },
    [user, refetch],
  );

  const deleteMember = useCallback(
    async (id: string) => {
      if (!user?.id) {
        toast.error("You must be signed in to remove team members.");
        throw new Error("Not signed in");
      }
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        toast.error("Failed to delete team member", { description: error.message });
        throw new Error(error.message);
      }
      await refetch();
    },
    [user, refetch],
  );

  const membersLoading = authLoading || loading;

  const store: TeamMembersStore = {
    members: user?.id ? members : [],
    loading: membersLoading,
    refetch,
    createMember,
    deleteMember,
  };
  return store;
}
