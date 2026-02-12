-- Project invites for team sharing (invite link / invite code)
-- Run after 0002_shared_projects.sql

create table public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_project_invites_code on public.project_invites(code);
create index idx_project_invites_project_id on public.project_invites(project_id);

alter table public.project_invites enable row level security;

-- Only project owners can create and read invites
create policy "Owners can create invites for their projects"
  on public.project_invites for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_invites.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'owner'
    )
  );

create policy "Owners can select invites for their projects"
  on public.project_invites for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_invites.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'owner'
    )
  );

-- RPC: join project via invite code (adds current user to project)
create or replace function public.join_project_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.project_invites%rowtype;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_invite
  from public.project_invites
  where code = upper(trim(p_code))
    and (expires_at is null or expires_at > now())
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  end if;

  insert into public.project_members (project_id, user_id, role)
  values (v_invite.project_id, v_user_id, 'member')
  on conflict (project_id, user_id) do nothing;

  delete from public.project_invites where id = v_invite.id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.join_project_invite(text) to authenticated;
