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

-- Upgrade an existing profiles table as well as creating a new one.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists district text;
alter table public.profiles add column if not exists profession text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists profile_photo_url text;
alter table public.profiles add column if not exists membership_number text;
alter table public.profiles add column if not exists membership_status text not null default 'pending';
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_membership_status_check;
alter table public.profiles add constraint profiles_membership_status_check
  check (membership_status in ('pending', 'approved', 'rejected', 'disabled'));
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'admin'));
create unique index if not exists profiles_membership_number_unique
  on public.profiles (membership_number) where membership_number is not null;

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

-- Compatibility name used by the login and dashboard scripts.
create or replace function public.is_ccg_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select public.is_admin(); $$;

-- Create the pending profile on the server after Supabase Auth creates a user.
-- This works whether or not e-mail confirmation is required.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, first_name, last_name, email, phone, city, district, profession,
    birth_date, gender, whatsapp, membership_number, membership_status, role
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', 'Prénom'),
    coalesce(new.raw_user_meta_data ->> 'last_name', 'Nom'),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'district', ''),
    new.raw_user_meta_data ->> 'profession',
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    new.raw_user_meta_data ->> 'gender',
    new.raw_user_meta_data ->> 'whatsapp',
    'CCG-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)),
    'pending',
    'member'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

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
using (public.is_admin() or auth.uid() = id);

-- Only these non-sensitive fields are exposed in the public directory.
create or replace view public.member_directory as
select id, first_name, last_name, city, district, membership_number,
       membership_status, profile_photo_url, created_at
from public.profiles
where membership_status = 'approved';

grant select on public.member_directory to anon, authenticated;

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

-- -------------------------------------------------------------------------
-- Security hardening for the browser-based administration area.
-- Keep this section at the end of the file so it replaces the permissive
-- development policies above when the script is run again.
-- -------------------------------------------------------------------------

-- An administrator must also be an approved member.  This prevents a
-- suspended administration account from keeping privileged access.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and membership_status = 'approved'
  );
$$;

create or replace function public.is_ccg_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select public.is_admin(); $$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_ccg_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_ccg_admin() to authenticated;

-- A member can only edit their own non-sensitive contact details.  Roles,
-- approval status, member number and e-mail are managed on the server/admin
-- side and cannot be forged from the browser.
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- No browser session, including an administrator session, may change
  -- account state.  Administrators use the trusted Edge Function for these
  -- changes; SQL-editor/server operations have no auth.uid() and remain able
  -- to provision the first administrator.
  if auth.uid() is not null then
    if new.id <> old.id
      or new.role <> old.role
      or new.membership_status <> old.membership_status
      or coalesce(new.membership_number, '') <> coalesce(old.membership_number, '')
      or new.email <> old.email
      or new.created_at <> old.created_at then
      raise exception 'Sensitive profile fields can only be changed by trusted server code';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_sensitive_columns on public.profiles;
create trigger profiles_protect_sensitive_columns
before update on public.profiles
for each row execute function public.protect_profile_sensitive_columns();

drop policy if exists "Users can create own pending profile" on public.profiles;
drop policy if exists "Members can update own profile" on public.profiles;
create policy "Members update only their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

-- Immutable, minimal audit trail.  It records administrative decisions
-- without copying private contact information into the log.
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  target_id uuid,
  action text not null check (action in ('profile_updated', 'profile_deleted', 'member_approved', 'member_rejected', 'member_disabled', 'member_enabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log"
on public.admin_audit_log for select
to authenticated
using (public.is_admin());

create or replace function public.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and public.is_admin() then
    insert into public.admin_audit_log (actor_id, target_id, action, metadata)
    values (
      auth.uid(),
      case when tg_op = 'DELETE' then old.id else new.id end,
      case when tg_op = 'DELETE' then 'profile_deleted' else 'profile_updated' end,
      jsonb_build_object(
        'previous_status', case when tg_op = 'DELETE' then old.membership_status else old.membership_status end,
        'current_status', case when tg_op = 'DELETE' then null else new.membership_status end
      )
    );
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists profiles_write_audit_log on public.profiles;
create trigger profiles_write_audit_log
after update or delete on public.profiles
for each row execute function public.audit_profile_change();

-- Harden avatar uploads: a signed-in user can only write their own image
-- folder, using a standard image format.  The bucket stays public only for
-- displaying approved profile photos on the public member directory.
drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'ccg-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'ccg-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'ccg-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;
revoke all on function public.protect_profile_sensitive_columns() from public;
revoke all on function public.audit_profile_change() from public;

-- -------------------------------------------------------------------------
-- Inbox and news management
-- -------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null check (char_length(trim(sender_name)) between 2 and 120),
  sender_email text not null check (char_length(trim(sender_email)) between 3 and 320),
  message text not null check (char_length(trim(message)) between 2 and 4000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) between 2 and 120),
  last_name text not null check (char_length(trim(last_name)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 3 and 320),
  phone text not null check (char_length(trim(phone)) between 3 and 60),
  city text not null check (char_length(trim(city)) between 2 and 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'archived')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 200),
  summary text not null check (char_length(trim(summary)) between 10 and 600),
  body text not null check (char_length(trim(body)) between 10 and 12000),
  category text not null default 'Communaute' check (char_length(trim(category)) between 2 and 80),
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);
create index if not exists membership_requests_status_created_at_idx
  on public.membership_requests (status, created_at desc);
create index if not exists news_articles_public_idx
  on public.news_articles (published_at desc) where status = 'published';

drop trigger if exists news_articles_set_updated_at on public.news_articles;
create trigger news_articles_set_updated_at
before update on public.news_articles
for each row execute function public.set_updated_at();

alter table public.contact_messages enable row level security;
alter table public.membership_requests enable row level security;
alter table public.news_articles enable row level security;

drop policy if exists "Public submits contact messages" on public.contact_messages;
create policy "Public submits contact messages"
on public.contact_messages for insert
to anon, authenticated
with check (status = 'new');

drop policy if exists "Public submits membership requests" on public.membership_requests;
create policy "Public submits membership requests"
on public.membership_requests for insert
to anon, authenticated
with check (status = 'pending' and reviewed_at is null and reviewed_by is null);

drop policy if exists "Admins manage membership requests" on public.membership_requests;
create policy "Admins manage membership requests"
on public.membership_requests for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage contact messages" on public.contact_messages;
create policy "Admins manage contact messages"
on public.contact_messages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public reads published news" on public.news_articles;
create policy "Public reads published news"
on public.news_articles for select
to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "Admins manage news" on public.news_articles;
create policy "Admins manage news"
on public.news_articles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- -------------------------------------------------------------------------
-- Publication d'actualites : diffusion e-mail et administration unique
-- -------------------------------------------------------------------------
-- The role alone is never sufficient for a browser session.  This final
-- definition deliberately restricts the administration area to the single
-- address supplied by CCG.  Passwords remain exclusively in Supabase Auth.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and membership_status = 'approved'
      and lower(email) = 'ccdughana@gmail.com'
  );
$$;

create or replace function public.is_ccg_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select public.is_admin(); $$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_ccg_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_ccg_admin() to authenticated;

create table if not exists public.news_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, member_id)
);

create index if not exists news_notification_deliveries_article_status_idx
  on public.news_notification_deliveries (article_id, status);

drop trigger if exists news_notification_deliveries_set_updated_at on public.news_notification_deliveries;
create trigger news_notification_deliveries_set_updated_at
before update on public.news_notification_deliveries
for each row execute function public.set_updated_at();

alter table public.news_notification_deliveries enable row level security;
drop policy if exists "Admins read news notification deliveries" on public.news_notification_deliveries;
create policy "Admins read news notification deliveries"
on public.news_notification_deliveries for select
to authenticated
using (public.is_admin());

-- Enable live refreshes for visitors already on the home page.  The block is
-- idempotent and leaves the schema usable if Realtime is managed elsewhere.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'news_articles'
     ) then
    alter publication supabase_realtime add table public.news_articles;
  end if;
exception when insufficient_privilege then
  raise notice 'Add public.news_articles to the supabase_realtime publication from the Supabase dashboard.';
end;
$$;
