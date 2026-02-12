-- Assignment support for phase_items
-- Run after 0002_shared_projects.sql

alter table public.phase_items
  add column if not exists assignee_user_id uuid references auth.users(id) on delete set null,
  add column if not exists assignee_name text;

create index if not exists idx_phase_items_assignee on public.phase_items(assignee_user_id);
