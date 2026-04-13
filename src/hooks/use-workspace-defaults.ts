"use client";

import { useEffect, useRef } from "react";
import type { LabelsStore } from "@/hooks/use-labels";
import type { TeamMembersStore } from "@/hooks/use-team-members";
import { randomLabelColor } from "@/lib/label-colors";

const SEEDED_KEY = "zen-board:workspace-seeded";

/**
 * Seeds a default solo member ("You") and labels ("Work", "Personal") when the
 * workspace is empty — once per user per browser (localStorage guard).
 */
export function useWorkspaceDefaults(
  userId: string | undefined,
  labelsStore: Pick<
    LabelsStore,
    "labels" | "loading" | "createLabel" | "refetch"
  >,
  teamStore: Pick<
    TeamMembersStore,
    "members" | "loading" | "createMember" | "refetch"
  >,
) {
  const seedingRef = useRef(false);

  useEffect(() => {
    if (
      !userId ||
      labelsStore.loading ||
      teamStore.loading ||
      seedingRef.current
    ) {
      return;
    }

    const alreadySeeded = localStorage.getItem(`${SEEDED_KEY}:${userId}`);
    if (alreadySeeded) return;

    const needMember = teamStore.members.length === 0;
    const needLabels = labelsStore.labels.length === 0;
    if (!needMember && !needLabels) {
      localStorage.setItem(`${SEEDED_KEY}:${userId}`, "1");
      return;
    }

    seedingRef.current = true;
    void (async () => {
      try {
        if (needMember) {
          await teamStore.createMember("You", "blue", { skipRefetch: true });
        }
        if (needLabels) {
          await labelsStore.createLabel("Work", randomLabelColor(), { skipRefetch: true });
          await labelsStore.createLabel("Personal", randomLabelColor(), {
            skipRefetch: true,
          });
        }
        localStorage.setItem(`${SEEDED_KEY}:${userId}`, "1");
        await Promise.all([labelsStore.refetch(), teamStore.refetch()]);
      } finally {
        seedingRef.current = false;
      }
    })();
  }, [
    userId,
    labelsStore.loading,
    teamStore.loading,
    labelsStore.labels.length,
    teamStore.members.length,
    labelsStore.createLabel,
    labelsStore.refetch,
    teamStore.createMember,
    teamStore.refetch,
  ]);
}
