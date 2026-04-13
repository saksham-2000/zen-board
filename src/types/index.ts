// Core data types matching our Supabase schema.

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

export type TaskPriority = "low" | "normal" | "high";

/** Stored on `labels.color`; map to UI via `LABEL_COLOR_CLASSES` in `@/lib/label-colors`. */
export type LabelColor =
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

/** Board “people” rows in `team_members`; `color` uses the same palette as `LabelColor`. */
export interface TeamMember {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  user_id: string;
  created_at: string;
  /** Per-column order (0 = top). Persisted in Supabase `tasks.board_position`. */
  board_position?: number;
  labels?: Label[];
  assignees?: TeamMember[];
}
