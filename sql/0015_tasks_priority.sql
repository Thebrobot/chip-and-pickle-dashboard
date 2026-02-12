-- Add priority and updated_at to tasks table
-- Run after 0014_phase_item_notes.sql

-- Add priority column with check constraint
alter table public.tasks
  add column if not exists priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low'));

-- Add updated_at column
alter table public.tasks
  add column if not exists updated_at timestamptz default now();

-- Create index for priority-based queries
create index if not exists idx_tasks_priority on public.tasks(priority);

-- Trigger to auto-update updated_at
create or replace function public.tasks_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_updated_at_trigger on public.tasks;
create trigger tasks_updated_at_trigger
  before update on public.tasks
  for each row
  execute function public.tasks_updated_at();
