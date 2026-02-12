-- Phase item notes - activity log / comment thread
-- Run after 0013_phase_items_updated_at.sql

create table public.phase_item_notes (
  id uuid primary key default gen_random_uuid(),
  phase_item_id uuid not null references public.phase_items(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_phase_item_notes_item on public.phase_item_notes(phase_item_id, created_at desc);
create index idx_phase_item_notes_project on public.phase_item_notes(project_id);
create index idx_phase_item_notes_user on public.phase_item_notes(user_id);

-- Trigger for updated_at
create or replace function public.phase_item_notes_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger phase_item_notes_updated_at_trigger
  before update on public.phase_item_notes
  for each row
  execute function public.phase_item_notes_updated_at();

-- Enable RLS
alter table public.phase_item_notes enable row level security;

-- RLS policies: project members can view/add/edit notes
create policy "Members can select phase_item_notes"
  on public.phase_item_notes for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_item_notes.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Members can insert phase_item_notes"
  on public.phase_item_notes for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = phase_item_notes.project_id and pm.user_id = auth.uid()
    )
    and user_id = auth.uid()
  );

create policy "Authors can update own phase_item_notes"
  on public.phase_item_notes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authors can delete own phase_item_notes"
  on public.phase_item_notes for delete
  using (user_id = auth.uid());
