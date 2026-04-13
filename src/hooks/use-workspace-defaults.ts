"use client";

import { useEffect } from "react";
import type { LabelsStore } from "@/hooks/use-labels";
import type { TeamMembersStore } from "@/hooks/use-team-members";
import { randomLabelColor } from "@/lib/label-colors";

const STORAGE_KEY = "zen-board:workspace-seeded";

/** Module-level guard — survives React Strict Mode double-mount and re-renders. */
const seededUsers = new Set<string>();

export function useWorkspaceDefaults(
  userId: string | undefined,
  labelsStore: Pick<LabelsStore, "labels" | "loading" | "createLabel" | "refetch">,
  teamStore: Pick<TeamMembersStore, "members" | "loading" | "createMember" | "refetch">,
) {
  const ready = !!userId && !labelsStore.loading && !teamStore.loading;
  const labelsEmpty = labelsStore.labels.length === 0;
  const membersEmpty = teamStore.members.length === 0;

  useEffect(() => {
    if (!ready || !userId) return;
    if (seededUsers.has(userId)) return;
    if (localStorage.getItem(`${STORAGE_KEY}:${userId}`)) {
      seededUsers.add(userId);
      return;
    }
    if (!labelsEmpty && !membersEmpty) {
      localStorage.setItem(`${STORAGE_KEY}:${userId}`, "1");
      seededUsers.add(userId);
      return;
    }

    seededUsers.add(userId);

    void (async () => {
      try {
        if (membersEmpty) {
          await teamStore.createMember("You", "blue", { skipRefetch: true });
        }
        if (labelsEmpty) {
          await labelsStore.createLabel("Work", randomLabelColor(), { skipRefetch: true });
          await labelsStore.createLabel("Personal", randomLabelColor(), { skipRefetch: true });
        }
        localStorage.setItem(`${STORAGE_KEY}:${userId}`, "1");
        await Promise.all([labelsStore.refetch(), teamStore.refetch()]);
      } catch {
        seededUsers.delete(userId);
      }
    })();
    // Only re-run when data finishes loading or userId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, labelsEmpty, membersEmpty]);
}
