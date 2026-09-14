-- CCG backend — Step 1: database architecture
-- Apply this file in the Supabase SQL Editor or with the Supabase CLI.
-- It contains no credentials and no service-role access.

create extension if not exists pgcrypto;

create type public.membership_category as enum ('adherent', 'visitor');
create type public.membership_status as enum ('pending', 'active', 'inactive', 'expired', 'rejected');
create type public.verification_status as enum ('unverified', 'verified', 'rejected');
create type public.application_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.admin_role as enum ('admin', 'editor');

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.admin_role not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) between 1 and 100),
  last_name text not null check (char_length(trim(last_name)) between 1 and 100),
  email text not null check (char_length(trim(email)) between 3 and 320),
  city text check (char_length(trim(city)) <= 120),
  neighborhood text check (char_length(trim(neighborhood)) <= 120),
  phone text check (char_length(trim(phone)) <= 40),
  requested_category public.membership_category not null default 'adherent',
  message text check (char_length(message) <= 2000),
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.admins(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 2000),
  created_member_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_review_state check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status in ('approved', 'rejected', 'withdrawn'))
  )
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.membership_applications(id) on delete set null,
  photo_path text,
  first_name text not null check (char_length(trim(first_name)) between 1 and 100),
  last_name text not null check (char_length(trim(last_name)) between 1 and 100),
  city text check (char_length(trim(city)) <= 120),
  neighborhood text check (char_length(trim(neighborhood)) <= 120),
  phone text check (char_length(trim(phone)) <= 40),
  membership_category public.membership_category not null default 'adherent',
  membership_status public.membership_status not null default 'pending',
  adhesion_id text unique,
  membership_date date,
  annual_fee_paid_until date,
  verification_status public.verification_status not null default 'unverified',
  approved_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_member_has_adhesion_id check (
    membership_status <> 'active' or adhesion_id is not null
  )
);

alter table public.membership_applications
  add constraint membership_applications_created_member_id_fkey
  foreign key (created_member_id) references public.members(id) on delete set null;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text check (char_length(description) <= 10000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text check (char_length(trim(location)) <= 300),
  image_path text,
  status public.content_status not null default 'draft',
  created_by uuid references public.admins(id) on delete set null,
  updated_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_end_after_start check (ends_at is null or ends_at >= starts_at)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  body text not null check (char_length(trim(body)) between 1 and 20000),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.admins(id) on delete set null,
  updated_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  category text check (char_length(trim(category)) <= 100),
  caption text check (char_length(caption) <= 1000),
  alt_text text check (char_length(alt_text) <= 250),
  status public.content_status not null default 'draft',
  uploaded_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index membership_applications_status_created_at_idx
  on public.membership_applications (status, created_at desc);
create index members_status_category_idx
  on public.members (membership_status, membership_category);
create index members_name_idx on public.members (last_name, first_name);
create index events_public_idx on public.events (starts_at) where status = 'published';
create index announcements_public_idx on public.announcements (published_at desc) where status = 'published';
create index gallery_public_idx on public.gallery (created_at desc) where status = 'published';

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

create trigger admins_set_updated_at before update on public.admins
  for each row execute function public.set_updated_at();
create trigger membership_applications_set_updated_at before update on public.membership_applications
  for each row execute function public.set_updated_at();
create trigger members_set_updated_at before update on public.members
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();
create trigger gallery_set_updated_at before update on public.gallery
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER avoids exposing the admins table to browser clients.
create or replace function public.is_ccg_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where id = auth.uid() and is_active = true
  );
$$;

grant execute on function public.is_ccg_admin() to anon, authenticated;

alter table public.admins enable row level security;
alter table public.members enable row level security;
alter table public.membership_applications enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.gallery enable row level security;

-- Only approved staff may access private records or change content.
create policy "admins manage members" on public.members
  for all to authenticated using (public.is_ccg_admin()) with check (public.is_ccg_admin());
create policy "admins manage applications" on public.membership_applications
  for all to authenticated using (public.is_ccg_admin()) with check (public.is_ccg_admin());
create policy "admins manage events" on public.events
  for all to authenticated using (public.is_ccg_admin()) with check (public.is_ccg_admin());
create policy "admins manage announcements" on public.announcements
  for all to authenticated using (public.is_ccg_admin()) with check (public.is_ccg_admin());
create policy "admins manage gallery metadata" on public.gallery
  for all to authenticated using (public.is_ccg_admin()) with check (public.is_ccg_admin());

-- The public can submit, but never read or modify, applications.
create policy "public submits applications" on public.membership_applications
  for insert to anon, authenticated with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and review_note is null
    and created_member_id is null
  );

-- Public pages see published content only.
create policy "public reads published events" on public.events
  for select to anon, authenticated using (status = 'published');
create policy "public reads published announcements" on public.announcements
  for select to anon, authenticated using (status = 'published');
create policy "public reads published gallery metadata" on public.gallery
  for select to anon, authenticated using (status = 'published');

-- Intentional: no policy on admins. Provision the first admin from the SQL Editor
-- only after creating that person through Supabase Auth (Step 2).
