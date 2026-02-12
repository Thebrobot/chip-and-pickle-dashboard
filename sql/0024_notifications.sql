-- Notifications table for in-app notifications
-- Run after 0023. Requires user_project_ids() from 0021.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at_desc on public.notifications(created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at) where read_at is null;

alter table public.notifications enable row level security;

-- SELECT: users can only see their own notifications within projects they belong to
create policy "Select own notifications in projects"
  on public.notifications for select
  using (
    user_id = auth.uid()
    and project_id in (select user_project_ids())
  );

-- UPDATE: users can only mark their own notifications as read
create policy "Update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- INSERT: users can insert notifications for themselves in projects they belong to
-- (temporary until service role / Edge Function is set up)
create policy "Insert own notifications in projects"
  on public.notifications for insert
  with check (
    user_id = auth.uid()
    and project_id in (select user_project_ids())
  );

-- RPC: create notification for any project member (for server actions notifying others)
-- Use this when you need to notify another user; service role bypasses RLS for direct inserts
create or replace function public.create_notification(
  p_project_id uuid,
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_id uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Not authenticated';
  end if;
  -- Caller must be in the project
  if not exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = v_caller_id
  ) then
    raise exception 'Not a member of this project';
  end if;
  -- Target user must be in the project
  if not exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = p_user_id
  ) then
    raise exception 'Target user is not in this project';
  end if;

  insert into notifications (project_id, user_id, type, title, body, link, metadata)
  values (p_project_id, p_user_id, p_type, p_title, p_body, p_link, p_metadata)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_notification(uuid, uuid, text, text, text, text, jsonb) to authenticated;
