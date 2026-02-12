-- Invite codes for project sharing
-- Run after 0002_shared_projects.sql

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_invite_codes_code on public.invite_codes(code);
create index idx_invite_codes_project_id on public.invite_codes(project_id);

alter table public.invite_codes enable row level security;

create policy "Owners can manage invite codes for their projects"
  on public.invite_codes for all
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = invite_codes.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = invite_codes.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'owner'
    )
  );

-- RPC: claim invite code (adds current user to project)
create or replace function public.claim_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invite_codes%rowtype;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_invite
  from public.invite_codes
  where code = p_code and expires_at > now()
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  end if;

  insert into public.project_members (project_id, user_id, role)
  values (v_invite.project_id, v_user_id, 'member')
  on conflict (project_id, user_id) do nothing;

  delete from public.invite_codes where id = v_invite.id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.claim_invite_code(text) to authenticated;
