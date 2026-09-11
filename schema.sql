-- CCG Phase 1 — Supabase database
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  district text not null,
  profession text,
  birth_date date,
  gender text,
  whatsapp text,
  profile_photo_url text,
  membership_number text unique,
  membership_status text not null default 'pending'
    check (membership_status in ('pending','approved','rejected','disabled')),
  role text not null default 'member'
    check (role in ('member','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Public can view approved member directory" on public.profiles;
create policy "Public can view approved member directory"
on public.profiles for select
to anon, authenticated
using (membership_status = 'approved');

drop policy if exists "Members can view own profile" on public.profiles;
create policy "Members can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create own pending profile" on public.profiles;
create policy "Users can create own pending profile"
on public.profiles for insert
to authenticated
with check (
  auth.uid() = id
  and role = 'member'
  and membership_status = 'pending'
);

drop policy if exists "Members can update own profile" on public.profiles;
create policy "Members can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (
  (auth.uid() = id and role = 'member')
  or public.is_admin()
);

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
on public.profiles for delete
to authenticated
using (public.is_admin());

-- Admin-only full directory access (including pending/rejected records)
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.is_admin() or auth.uid() = id or membership_status = 'approved');

-- Avatar storage
insert into storage.buckets (id, name, public)
values ('ccg-avatars', 'ccg-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'ccg-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'ccg-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public can view CCG avatars" on storage.objects;
create policy "Public can view CCG avatars"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'ccg-avatars');

-- After creating your first account, make it the administrator:
-- update public.profiles set role='admin', membership_status='approved'
-- where email='YOUR_ADMIN_EMAIL';
