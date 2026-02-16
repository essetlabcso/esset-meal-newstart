-- Gate 22: reporting_periods tenant/project guard + policy hardening
-- Ensures reporting_periods.project_id always belongs to reporting_periods.tenant_id.

create or replace function public.project_belongs_to_tenant(_project_id uuid, _tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = _project_id
      and p.tenant_id = _tenant_id
  );
$$;

create or replace function public.enforce_reporting_period_project_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.project_belongs_to_tenant(new.project_id, new.tenant_id) then
    raise exception 'Invalid reporting period scope';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reporting_period_scope on public.reporting_periods;
create trigger trg_reporting_period_scope
before insert or update on public.reporting_periods
for each row execute function public.enforce_reporting_period_project_scope();

drop policy if exists "reporting_periods_insert_if_member" on public.reporting_periods;
create policy "reporting_periods_insert_if_member"
on public.reporting_periods for insert
to authenticated
with check (
  public.is_tenant_member(tenant_id)
  and public.project_belongs_to_tenant(project_id, tenant_id)
  and created_by = auth.uid()
);

drop policy if exists "reporting_periods_update_if_admin_or_creator" on public.reporting_periods;
create policy "reporting_periods_update_if_admin_or_creator"
on public.reporting_periods for update
to authenticated
using (
  public.is_org_admin(tenant_id)
  or created_by = auth.uid()
)
with check (
  (public.is_org_admin(tenant_id) or created_by = auth.uid())
  and public.project_belongs_to_tenant(project_id, tenant_id)
);
