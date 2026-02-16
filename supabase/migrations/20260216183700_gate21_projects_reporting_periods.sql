-- Gate 21: Projects + Reporting Periods MVP
-- Harden projects RLS and add reporting_periods table

-- 1. Harden projects RLS
-- Existing policies in 20260215054710_gate4_projects.sql used is_org_admin(tenant_id)
-- We want to ensure update/delete are allowed for the creator OR the admin.

drop policy if exists "projects_update_admin_only" on public.projects;
create policy "projects_update_if_admin_or_creator"
on public.projects for update
to authenticated
using (
  public.is_org_admin(tenant_id) 
  or created_by = auth.uid()
)
with check (
  public.is_org_admin(tenant_id) 
  or created_by = auth.uid()
);

drop policy if exists "projects_delete_admin_only" on public.projects;
create policy "projects_delete_if_admin_or_creator"
on public.projects for delete
to authenticated
using (
  public.is_org_admin(tenant_id) 
  or created_by = auth.uid()
);

-- Index for performance
create index if not exists idx_projects_tenant_created_at 
on public.projects (tenant_id, created_at desc);


-- 2. Reporting Periods table
create table if not exists public.reporting_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint reporting_periods_date_check check (start_date <= end_date)
);

-- Indexes
create index if not exists idx_reporting_periods_tenant_project on public.reporting_periods (tenant_id, project_id);
create index if not exists idx_reporting_periods_project_date on public.reporting_periods (project_id, start_date);

-- updated_at trigger
drop trigger if exists trg_reporting_periods_updated_at on public.reporting_periods;
create trigger trg_reporting_periods_updated_at
before update on public.reporting_periods
for each row execute function public.set_updated_at();

-- RLS
alter table public.reporting_periods enable row level security;

-- Policies
create policy "reporting_periods_select_if_member"
on public.reporting_periods for select
to authenticated
using (public.is_tenant_member(tenant_id));

create policy "reporting_periods_insert_if_member"
on public.reporting_periods for insert
to authenticated
with check (
  public.is_tenant_member(tenant_id)
  and created_by = auth.uid()
);

create policy "reporting_periods_update_if_admin_or_creator"
on public.reporting_periods for update
to authenticated
using (
  public.is_org_admin(tenant_id)
  or created_by = auth.uid()
)
with check (
  public.is_org_admin(tenant_id)
  or created_by = auth.uid()
);

create policy "reporting_periods_delete_if_admin_or_creator"
on public.reporting_periods for delete
to authenticated
using (
  public.is_org_admin(tenant_id)
  or created_by = auth.uid()
);
