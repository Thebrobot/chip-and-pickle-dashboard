-- Single-project app: automatically add all users to the project (and thus the team)
-- When someone signs up or is invited, they get access to the app = access to the project

-- 1. Update handle_new_user: create profile + auto-add to all projects
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create profile (matches 0019 fields)
  insert into public.profiles (user_id, first_name, last_name, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.email), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', nullif(trim(substring(coalesce(new.raw_user_meta_data->>'full_name', '') from position(' ' in coalesce(new.raw_user_meta_data->>'full_name', '') || ' '))), '')),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    new.email
  );

  -- Auto-add to all projects (single-project app: everyone gets access)
  insert into public.project_members (project_id, user_id, role)
  select id, new.id, 'member'
  from public.projects
  on conflict (project_id, user_id) do nothing;

  return new;
end;
$$;

-- 2. Backfill: add existing users who aren't in any project
insert into public.project_members (project_id, user_id, role)
select p.id, u.id, 'member'
from auth.users u
cross join public.projects p
where not exists (
  select 1 from public.project_members pm
  where pm.project_id = p.id and pm.user_id = u.id
)
on conflict (project_id, user_id) do nothing;
