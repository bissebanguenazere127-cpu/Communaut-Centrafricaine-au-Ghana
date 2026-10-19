-- CCG Community Backend — clean initial schema
-- Run this entire file once in the SQL Editor of the new Supabase project.

begin;

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- Member accounts and public member directory
-- -------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  district text not null default '',
  profession text,
  birth_date date,
  gender text,
  whatsapp text,
  profile_photo_url text,
  membership_number text unique,
  membership_status text not null default 'pending'
    check (membership_status in ('pending', 'approved', 'rejected', 'disabled')),
  role text not null default 'member'
    check (role in ('member', 'admin')),
  constraint profiles_admin_email_check
    check (role <> 'admin' or lower(trim(email)) = 'ccdughana@gmail.com'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_membership_status_idx
  on public.profiles (membership_status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, first_name, last_name, email, phone, city, district, profession,
    birth_date, gender, whatsapp, membership_number
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'district', ''),
    nullif(new.raw_user_meta_data ->> 'profession', ''),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    nullif(new.raw_user_meta_data ->> 'whatsapp', ''),
    'CCG-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and (
    new.id <> old.id
    or new.role <> old.role
    or new.membership_status <> old.membership_status
    or coalesce(new.membership_number, '') <> coalesce(old.membership_number, '')
    or new.email <> old.email
    or new.created_at <> old.created_at
  ) then
    raise exception 'Sensitive profile fields can only be changed by the server';
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger profiles_protect_sensitive_columns
before update on public.profiles
for each row execute function public.protect_profile_sensitive_columns();

-- Only the designated CCG account can ever receive browser-level
-- administration privileges.  The e-mail claim comes from the signed
-- Supabase Auth JWT; the profile role and approval state remain server-managed.
create or replace function public.is_ccg_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'ccdughana@gmail.com'
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and membership_status = 'approved'
        and lower(trim(email)) = 'ccdughana@gmail.com'
    );
$$;

revoke all on function public.is_ccg_admin() from public;
grant execute on function public.is_ccg_admin() to authenticated;

-- This view deliberately exposes only approved members and only the fields
-- needed by the public directory.
create view public.member_directory as
select
  id, first_name, last_name, city, district, membership_number,
  membership_status, profile_photo_url, created_at
from public.profiles
where membership_status = 'approved';

grant select on public.member_directory to anon, authenticated;

-- -------------------------------------------------------------------------
-- Website forms and public news
-- -------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null check (char_length(trim(sender_name)) between 2 and 120),
  sender_email text not null check (char_length(trim(sender_email)) between 3 and 320),
  message text not null check (char_length(trim(message)) between 2 and 4000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) between 2 and 120),
  last_name text not null check (char_length(trim(last_name)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 3 and 320),
  phone text not null check (char_length(trim(phone)) between 3 and 60),
  city text not null check (char_length(trim(city)) between 2 and 120),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 200),
  summary text not null check (char_length(trim(summary)) between 10 and 600),
  body text not null check (char_length(trim(body)) between 10 and 12000),
  category text not null default 'Communaute'
    check (char_length(trim(category)) between 2 and 80),
  cover_image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create index contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);
create index membership_requests_status_created_at_idx
  on public.membership_requests (status, created_at desc);
create index news_articles_published_at_idx
  on public.news_articles (published_at desc) where status = 'published';

create trigger news_articles_set_updated_at
before update on public.news_articles
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- Avatar storage
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ccg-avatars', 'ccg-avatars', true)
on conflict (id) do nothing;

-- -------------------------------------------------------------------------
-- Row Level Security
-- The Node administration server uses a Supabase Secret key and therefore
-- bypasses these rules. Visitors receive only the access listed below.
-- -------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.contact_messages enable row level security;
alter table public.membership_requests enable row level security;
alter table public.news_articles enable row level security;

create policy "Members read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Members update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Visitors submit contact messages"
on public.contact_messages for insert
to anon, authenticated
with check (status = 'new');

create policy "Visitors submit membership requests"
on public.membership_requests for insert
to anon, authenticated
with check (status = 'pending' and reviewed_at is null);

create policy "Visitors read published news"
on public.news_articles for select
to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

create policy "Members upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'ccg-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

create policy "Members update their own avatar"
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

create policy "Visitors view CCG avatars"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'ccg-avatars');

-- Live updates allow the home page to refresh published news without reload.
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
end;
$$;

commit;
