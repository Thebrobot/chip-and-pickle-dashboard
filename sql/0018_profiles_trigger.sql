-- Migration: Auto-create profile for new users and backfill existing users
-- This ensures every user in auth.users has a corresponding profile

-- 1. Create function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

-- 2. Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill: Create profiles for any existing users without one
insert into public.profiles (user_id, full_name)
select 
  id,
  coalesce(raw_user_meta_data->>'full_name', email)
from auth.users
where not exists (
  select 1 from public.profiles where user_id = auth.users.id
)
on conflict (user_id) do nothing;
