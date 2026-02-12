-- Add updated_at to phase_items for tracking edits
-- Run after 0012_fix_rls_simple.sql

alter table public.phase_items
  add column if not exists updated_at timestamptz default now();

-- Trigger to auto-update updated_at on modify
create or replace function public.phase_items_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists phase_items_updated_at_trigger on public.phase_items;
create trigger phase_items_updated_at_trigger
  before update on public.phase_items
  for each row
  execute function public.phase_items_updated_at();
