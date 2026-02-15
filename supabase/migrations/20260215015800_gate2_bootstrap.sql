-- Gate 2: baseline schema + RLS (profiles + orgs)

-- Extensions (safe)
create extension if not exists pgcrypto;

-- 1) profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- 2) organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- 3) org_memberships
create table if not exists public.org_memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

alter table public.org_memberships enable row level security;

-- Security definer helper (admin check)
create or replace function public.is_org_admin(_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = _org_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

-- org_memberships policies
drop policy if exists "orgm_select_if_member" on public.org_memberships;
create policy "orgm_select_if_member"
on public.org_memberships for select
to authenticated
using (
  exists (
    select 1
    from public.org_memberships m
    where m.org_id = org_memberships.org_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "orgm_insert_admin_only" on public.org_memberships;
create policy "orgm_insert_admin_only"
on public.org_memberships for insert
to authenticated
with check (
  -- allow creator bootstrap (owner row) OR admins adding members
  (user_id = auth.uid() and role = 'owner' and exists (select 1 from public.organizations o where o.id = org_id and o.created_by = auth.uid()))
  or public.is_org_admin(org_id)
);

drop policy if exists "orgm_update_admin_only" on public.org_memberships;
create policy "orgm_update_admin_only"
on public.org_memberships for update
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "orgm_delete_admin_only" on public.org_memberships;
create policy "orgm_delete_admin_only"
on public.org_memberships for delete
to authenticated
using (public.is_org_admin(org_id));

-- organizations policies
drop policy if exists "org_select_if_member" on public.organizations;
create policy "org_select_if_member"
on public.organizations for select
to authenticated
using (
  exists (
    select 1
    from public.org_memberships m
    where m.org_id = organizations.id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "org_insert_authenticated" on public.organizations;
create policy "org_insert_authenticated"
on public.organizations for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "org_update_admin_only" on public.organizations;
create policy "org_update_admin_only"
on public.organizations for update
to authenticated
using (public.is_org_admin(id))
with check (public.is_org_admin(id));

drop policy if exists "org_delete_admin_only" on public.organizations;
create policy "org_delete_admin_only"
on public.organizations for delete
to authenticated
using (public.is_org_admin(id));

-- Trigger: create profile row when auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Trigger: when org is created, add creator as owner member
create or replace function public.handle_new_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.org_memberships (org_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (org_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_org_created_add_owner on public.organizations;
create trigger on_org_created_add_owner
after insert on public.organizations
for each row execute function public.handle_new_org();
