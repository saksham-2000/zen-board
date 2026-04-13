import type { LabelColor } from "@/types";

export const LABEL_COLOR_NAMES = [
  "red",
  "orange",
  "amber",
  "green",
  "blue",
  "purple",
  "pink",
] as const satisfies readonly LabelColor[];

export function randomLabelColor(): LabelColor {
  const i = Math.floor(Math.random() * LABEL_COLOR_NAMES.length);
  return LABEL_COLOR_NAMES[i]!;
}

/** Tailwind classes for label chips (subtle fill + text; works on light/dark). */
export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  red: "border border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-200",
  orange:
    "border border-orange-500/25 bg-orange-500/10 text-orange-900 dark:text-orange-200",
  amber:
    "border border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  green:
    "border border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  blue: "border border-sky-500/25 bg-sky-500/10 text-sky-900 dark:text-sky-200",
  purple:
    "border border-purple-500/25 bg-purple-500/10 text-purple-900 dark:text-purple-200",
  pink: "border border-pink-500/25 bg-pink-500/10 text-pink-900 dark:text-pink-200",
};

export function isLabelColor(value: string): value is LabelColor {
  return (LABEL_COLOR_NAMES as readonly string[]).includes(value);
}

export function labelColorClass(color: string): string {
  return isLabelColor(color)
    ? LABEL_COLOR_CLASSES[color]
    : "border border-border/60 bg-muted/40 text-muted-foreground";
}

/** Compact dots for TaskCard overflow row. */
export const LABEL_DOT_CLASSES: Record<LabelColor, string> = {
  red: "bg-red-500/75",
  orange: "bg-orange-500/75",
  amber: "bg-amber-500/75",
  green: "bg-emerald-500/75",
  blue: "bg-sky-500/75",
  purple: "bg-purple-500/75",
  pink: "bg-pink-500/75",
};

export function labelDotClass(color: string): string {
  return isLabelColor(color)
    ? LABEL_DOT_CLASSES[color]
    : "bg-muted-foreground/45";
}

/** Compact pill for task cards: light tint + hue-matched text. */
export function labelPillClass(color: string): string {
  return isLabelColor(color)
    ? `${LABEL_COLOR_CLASSES[color]} max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight`
    : "max-w-full truncate rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium leading-tight text-muted-foreground";
}

/** Solid avatar fills for stacked assignee chips (opaque overlap; pair with ring matching card bg). */
export const LABEL_AVATAR_SOLID_CLASSES: Record<LabelColor, string> = {
  red: "bg-red-500 text-white",
  orange: "bg-orange-500 text-white",
  amber: "bg-amber-500 text-white",
  green: "bg-emerald-500 text-white",
  blue: "bg-sky-500 text-white",
  purple: "bg-purple-500 text-white",
  pink: "bg-pink-500 text-white",
};

export function labelAvatarSolidClass(color: string): string {
  return isLabelColor(color)
    ? LABEL_AVATAR_SOLID_CLASSES[color]
    : "bg-muted text-muted-foreground";
}
