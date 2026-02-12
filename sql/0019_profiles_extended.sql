-- Migration: Add first_name, last_name, phone to profiles table

-- 1. Add new columns to profiles
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists email text;

-- 2. For existing profiles with full_name, try to split into first/last
-- This is a one-time backfill that attempts to split full_name
update public.profiles
set 
  first_name = split_part(full_name, ' ', 1),
  last_name = nullif(trim(substring(full_name from position(' ' in full_name || ' '))), '')
where full_name is not null 
  and full_name != ''
  and first_name is null;

-- 3. Backfill email from auth.users for existing profiles (requires function)
update public.profiles p
set email = (
  select email 
  from auth.users u 
  where u.id = p.user_id
)
where email is null or email = '';

-- 4. Update the trigger function to store all fields
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, first_name, last_name, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.email), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', nullif(trim(substring(coalesce(new.raw_user_meta_data->>'full_name', '') from position(' ' in coalesce(new.raw_user_meta_data->>'full_name', '') || ' '))), '')),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$;

-- Note: full_name is kept for backward compatibility and will be auto-generated from first_name + last_name in the app
