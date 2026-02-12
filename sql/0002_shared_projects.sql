-- Shared project access for multiple users
-- Run after 0001_phases.sql. Requires projects, phases, phase_sections, phase_items to exist.

-- 1) project_members (must exist before profiles policy that references it)
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create index idx_project_members_project_id on public.project_members(project_id);
create index idx_project_members_user_id on public.project_members(user_id);

alter table public.project_members enable row level security;

create policy "Users can select members of their projects"
  on public.project_members for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
    )
  );

create policy "Owners can insert project members"
  on public.project_members for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'owner'
    )
  );

create policy "Owners can delete project members"
  on public.project_members for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'owner'
    )
  );

-- Backfill: add existing project creators as owners
insert into public.project_members (project_id, user_id, role)
  select id, user_id, 'owner' from public.projects
  on conflict (project_id, user_id) do nothing;

-- Trigger: auto-add creator as owner when a new project is inserted
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.user_id, 'owner');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- 2) profiles
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can select own profile"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (user_id = auth.uid());

create policy "Users can select profiles of project collaborators"
  on public.profiles for select
  using (
    exists (
      select 1 from public.project_members pm1
      join public.project_members pm2 on pm1.project_id = pm2.project_id
      where pm1.user_id = auth.uid()
        and pm2.user_id = profiles.user_id
    )
  );

-- Drop old RLS policies on projects
drop policy if exists "Users can select own projects" on public.projects;
drop policy if exists "Users can insert own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

-- New RLS: access based on project membership
create policy "Members can select projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
  );

create policy "Users can insert projects"
  on public.projects for insert
  with check (user_id = auth.uid());

create policy "Members can update projects"
  on public.projects for update
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
  );

create policy "Owners can delete projects"
  on public.projects for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role = 'owner'
    )
  );

-- Drop old RLS policies on phases
drop policy if exists "Users can select own phases" on public.phases;
drop policy if exists "Users can insert own phases" on public.phases;
drop policy if exists "Users can update own phases" on public.phases;
drop policy if exists "Users can delete own phases" on public.phases;

create policy "Members can select phases"
  on public.phases for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phases.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can insert phases"
  on public.phases for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phases.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can update phases"
  on public.phases for update
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phases.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can delete phases"
  on public.phases for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phases.project_id and pm.user_id = auth.uid()
    )
  );

-- Drop old RLS policies on phase_sections
drop policy if exists "Users can select own phase_sections" on public.phase_sections;
drop policy if exists "Users can insert own phase_sections" on public.phase_sections;
drop policy if exists "Users can update own phase_sections" on public.phase_sections;
drop policy if exists "Users can delete own phase_sections" on public.phase_sections;

create policy "Members can select phase_sections"
  on public.phase_sections for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_sections.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can insert phase_sections"
  on public.phase_sections for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_sections.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can update phase_sections"
  on public.phase_sections for update
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_sections.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can delete phase_sections"
  on public.phase_sections for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_sections.project_id and pm.user_id = auth.uid()
    )
  );

-- Drop old RLS policies on phase_items
drop policy if exists "Users can select own phase_items" on public.phase_items;
drop policy if exists "Users can insert own phase_items" on public.phase_items;
drop policy if exists "Users can update own phase_items" on public.phase_items;
drop policy if exists "Users can delete own phase_items" on public.phase_items;

create policy "Members can select phase_items"
  on public.phase_items for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_items.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can insert phase_items"
  on public.phase_items for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_items.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can update phase_items"
  on public.phase_items for update
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_items.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can delete phase_items"
  on public.phase_items for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_items.project_id and pm.user_id = auth.uid()
    )
  );
