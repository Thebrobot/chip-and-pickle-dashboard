-- Budget items for project cost tracking
-- Run after 0002_shared_projects.sql

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  item_name text not null,
  forecast_amount numeric,
  actual_amount numeric,
  vendor text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_budget_items_project_id on public.budget_items(project_id);

alter table public.budget_items enable row level security;

-- RLS: project members can select/insert/update/delete budget_items for their projects
create policy "Members can select budget_items"
  on public.budget_items for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = budget_items.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can insert budget_items"
  on public.budget_items for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = budget_items.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can update budget_items"
  on public.budget_items for update
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = budget_items.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can delete budget_items"
  on public.budget_items for delete
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = budget_items.project_id and pm.user_id = auth.uid()
    )
  );
