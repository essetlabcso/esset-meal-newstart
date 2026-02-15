create extension if not exists pgcrypto;

-- Projects (tenant-scoped)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  short_code text,
  description text,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft','active','closed','archived')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- helpful uniqueness per tenant (optional)
create unique index if not exists projects_tenant_short_code_ux
on public.projects (tenant_id, short_code)
where short_code is not null and length(short_code) > 0;

create index if not exists projects_tenant_id_idx on public.projects (tenant_id);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

-- updated_at trigger
drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

-- Helper: membership check (reuse org_memberships as tenant membership)
create or replace function public.is_tenant_member(_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = _tenant_id
      and m.user_id = auth.uid()
  );
$$;

-- Helper: admin check (wrap existing is_org_admin if present; otherwise implement here)
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = _org_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

-- Projects policies
drop policy if exists "projects_select_if_member" on public.projects;
create policy "projects_select_if_member"
on public.projects for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "projects_insert_if_member" on public.projects;
create policy "projects_insert_if_member"
on public.projects for insert
to authenticated
with check (
  public.is_tenant_member(tenant_id)
  and created_by = auth.uid()
);

drop policy if exists "projects_update_admin_only" on public.projects;
create policy "projects_update_admin_only"
on public.projects for update
to authenticated
using (public.is_org_admin(tenant_id))
with check (public.is_org_admin(tenant_id));

drop policy if exists "projects_delete_admin_only" on public.projects;
create policy "projects_delete_admin_only"
on public.projects for delete
to authenticated
using (public.is_org_admin(tenant_id));
