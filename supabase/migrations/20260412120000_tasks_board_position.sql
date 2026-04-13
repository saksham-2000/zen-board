-- Per-column ordering for the kanban board (see `use-tasks` + `computeTasksAfterDrag`).
alter table public.tasks
  add column if not exists board_position integer not null default 0;

create index if not exists tasks_user_status_board_position_idx
  on public.tasks (user_id, status, board_position);
