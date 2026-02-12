-- Activity events table for activity feed
-- Run after 0024. Requires user_project_ids() from 0021.

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  summary text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_events_project_created on public.activity_events(project_id, created_at desc);

alter table public.activity_events enable row level security;

-- SELECT: project members can see activity events for their projects
create policy "Select activity in own projects"
  on public.activity_events for select
  using (project_id in (select user_project_ids()));

-- INSERT: users can insert activity only for themselves, in projects they belong to
create policy "Insert own activity in projects"
  on public.activity_events for insert
  with check (
    actor_user_id = auth.uid()
    and project_id in (select user_project_ids())
  );
