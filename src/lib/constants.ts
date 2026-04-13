// Board column ids (TaskStatus) — Board, Column, and DnD use these.
export const COLUMNS = [
  { id: "todo", label: "🚨 To Do" },
  { id: "in_progress", label: "⚡ In Progress" },
  { id: "in_review", label: "👀 In Review" },
  { id: "done", label: "✅ Done" },
] as const;
