-- Migration: Add paid status to budget items

-- Add paid column to budget_items table
alter table public.budget_items
  add column if not exists paid boolean not null default false;

-- Add paid_date to track when payment was made
alter table public.budget_items
  add column if not exists paid_date timestamptz;

-- Create index for filtering by paid status
create index if not exists idx_budget_items_paid 
  on public.budget_items(paid);
