-- Contractors (contact directory) for project
-- Run after 0002_shared_projects.sql

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  company text,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_contractors_project_id on public.contractors(project_id);

alter table public.contractors enable row level security;

-- RLS: project members can select/insert/update/delete contractors for their projects
create policy "Members can select contractors"
  on public.contractors for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = contractors.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can insert contractors"
  on public.contractors for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = contractors.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can update contractors"
  on public.contractors for update
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = contractors.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can delete contractors"
  on public.contractors for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = contractors.project_id and pm.user_id = auth.uid()
    )
  );
