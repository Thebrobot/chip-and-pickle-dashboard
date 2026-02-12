-- Tasks table for project task management
-- Run after 0002_shared_projects.sql

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  due_date date,
  assignee_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint tasks_status_check check (status in ('todo', 'in_progress', 'done'))
);

create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_assignee_user_id on public.tasks(assignee_user_id);
create index idx_tasks_status on public.tasks(status);

alter table public.tasks enable row level security;

-- RLS: project members can select/insert/update/delete tasks for their projects
create policy "Members can select tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = tasks.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can insert tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = tasks.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = tasks.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can delete tasks"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = tasks.project_id and pm.user_id = auth.uid()
    )
  );
