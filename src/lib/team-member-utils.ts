import { isLabelColor, LABEL_COLOR_NAMES } from "@/lib/label-colors";
import type { LabelColor } from "@/types";

/**
 * Accent color for UI: uses stored `color` when valid, otherwise a stable hue from `id`
 * (so legacy rows still read as distinct people, like label colors).
 */
export function teamMemberAccentColor(member: {
  id: string;
  color: string;
}): LabelColor {
  if (isLabelColor(member.color)) return member.color;
  let h = 0;
  for (let i = 0; i < member.id.length; i++) {
    h = (Math.imul(31, h) + member.id.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % LABEL_COLOR_NAMES.length;
  return LABEL_COLOR_NAMES[idx]!;
}

/** Initials for team member avatars (first letter, or two initials from first two words). */
export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}
