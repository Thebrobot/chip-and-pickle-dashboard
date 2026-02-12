-- Phase-based construction project tracker
-- Run this migration in Supabase SQL Editor

-- 1) projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  target_open_date date,
  created_at timestamptz not null default now()
);

-- 2) phases
create table public.phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_order int not null,
  title text not null,
  created_at timestamptz not null default now()
);

-- 3) phase_sections
create table public.phase_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid not null references public.phases(id) on delete cascade,
  section_order int not null,
  title text not null,
  created_at timestamptz not null default now()
);

-- 4) phase_items
create table public.phase_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid not null references public.phases(id) on delete cascade,
  section_id uuid not null references public.phase_sections(id) on delete cascade,
  item_order int not null,
  title text not null,
  is_completed boolean not null default false,
  notes text,
  owner_name text,
  due_date date,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Indexes for common lookups
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_created_at on public.projects(created_at desc);

create index idx_phases_user_id on public.phases(user_id);
create index idx_phases_project_id on public.phases(project_id);
create index idx_phases_project_order on public.phases(project_id, phase_order);

create index idx_phase_sections_user_id on public.phase_sections(user_id);
create index idx_phase_sections_project_id on public.phase_sections(project_id);
create index idx_phase_sections_phase_id on public.phase_sections(phase_id);
create index idx_phase_sections_phase_order on public.phase_sections(phase_id, section_order);

create index idx_phase_items_user_id on public.phase_items(user_id);
create index idx_phase_items_project_id on public.phase_items(project_id);
create index idx_phase_items_phase_id on public.phase_items(phase_id);
create index idx_phase_items_section_id on public.phase_items(section_id);
create index idx_phase_items_section_order on public.phase_items(section_id, item_order);

-- Enable RLS on all tables
alter table public.projects enable row level security;
alter table public.phases enable row level security;
alter table public.phase_sections enable row level security;
alter table public.phase_items enable row level security;

-- RLS policies: user-owned data only
create policy "Users can select own projects"
  on public.projects for select
  using (user_id = auth.uid());

create policy "Users can insert own projects"
  on public.projects for insert
  with check (user_id = auth.uid());

create policy "Users can update own projects"
  on public.projects for update
  using (user_id = auth.uid());

create policy "Users can delete own projects"
  on public.projects for delete
  using (user_id = auth.uid());

create policy "Users can select own phases"
  on public.phases for select
  using (user_id = auth.uid());

create policy "Users can insert own phases"
  on public.phases for insert
  with check (user_id = auth.uid());

create policy "Users can update own phases"
  on public.phases for update
  using (user_id = auth.uid());

create policy "Users can delete own phases"
  on public.phases for delete
  using (user_id = auth.uid());

create policy "Users can select own phase_sections"
  on public.phase_sections for select
  using (user_id = auth.uid());

create policy "Users can insert own phase_sections"
  on public.phase_sections for insert
  with check (user_id = auth.uid());

create policy "Users can update own phase_sections"
  on public.phase_sections for update
  using (user_id = auth.uid());

create policy "Users can delete own phase_sections"
  on public.phase_sections for delete
  using (user_id = auth.uid());

create policy "Users can select own phase_items"
  on public.phase_items for select
  using (user_id = auth.uid());

create policy "Users can insert own phase_items"
  on public.phase_items for insert
  with check (user_id = auth.uid());

create policy "Users can update own phase_items"
  on public.phase_items for update
  using (user_id = auth.uid());

create policy "Users can delete own phase_items"
  on public.phase_items for delete
  using (user_id = auth.uid());
