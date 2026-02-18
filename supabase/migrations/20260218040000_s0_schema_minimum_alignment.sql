-- S0 schema-only alignment patch (additive, no Gate A logic changes)
-- Aligns minimum Strategy Engine schema to Enhanced Master Spec S0 requirements.

begin;

-- ---------------------------------------------------------------------------
-- analysis_snapshots minimum contract alignment (SNAP-01 fields)
-- ---------------------------------------------------------------------------

alter table public.analysis_snapshots
  add column if not exists captured_at timestamptz;

update public.analysis_snapshots
set captured_at = created_at
where captured_at is null;

alter table public.analysis_snapshots
  alter column captured_at set default now();

alter table public.analysis_snapshots
  alter column captured_at set not null;

alter table public.analysis_snapshots
  add column if not exists source text;

update public.analysis_snapshots
set source = 'ANL module'
where source is null;

alter table public.analysis_snapshots
  alter column source set default 'ANL module';

alter table public.analysis_snapshots
  alter column source set not null;

-- ---------------------------------------------------------------------------
-- toc_versions minimum contract alignment
-- ---------------------------------------------------------------------------

alter table public.toc_versions
  add column if not exists version_label text;

update public.toc_versions
set version_label = 'v' || coalesce(version_number, 0)::text
where version_label is null;

alter table public.toc_versions
  alter column version_label set not null;

-- Expand status domain to include ARCHIVED.
alter table public.toc_versions
  drop constraint if exists toc_versions_status_check;

alter table public.toc_versions
  add constraint toc_versions_status_check
  check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED'));

-- Published rows must carry publish markers.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'toc_versions_published_fields_check'
      and conrelid = 'public.toc_versions'::regclass
  ) then
    alter table public.toc_versions
      add constraint toc_versions_published_fields_check
      check (
        status <> 'PUBLISHED'
        or (published_at is not null and linked_analysis_snapshot_id is not null)
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- toc_nodes minimum contract alignment
-- ---------------------------------------------------------------------------

alter table public.toc_nodes
  add column if not exists narrative text;

update public.toc_nodes
set narrative = description
where narrative is null
  and description is not null;

-- ---------------------------------------------------------------------------
-- Published immutability enforcement on toc_versions (policy approach)
-- ---------------------------------------------------------------------------

drop policy if exists "toc_versions_update" on public.toc_versions;
drop policy if exists "toc_versions_delete" on public.toc_versions;

create policy "toc_versions_update" on public.toc_versions
  for update to authenticated
  using (public.is_org_admin(tenant_id) and status = 'DRAFT')
  with check (public.is_org_admin(tenant_id));

create policy "toc_versions_delete" on public.toc_versions
  for delete to authenticated
  using (public.is_org_admin(tenant_id) and status = 'DRAFT');

commit;
