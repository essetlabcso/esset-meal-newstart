-- S0 RLS baseline hardening: tenant-scoped writes without existence leaks
-- Scope: policy predicates only (no Gate A logic changes)

begin;

-- Ensure RLS remains enabled on all S0 tables.
alter table public.analysis_snapshots enable row level security;
alter table public.toc_versions enable row level security;
alter table public.toc_nodes enable row level security;
alter table public.toc_edges enable row level security;
alter table public.toc_assumptions enable row level security;
alter table public.toc_edge_assumptions enable row level security;
alter table public.toc_projections enable row level security;
alter table public.report_manifests enable row level security;

-- ---------------------------------------------------------------------------
-- analysis_snapshots: tenant-scoped write checks with project alignment
-- ---------------------------------------------------------------------------

drop policy if exists "analysis_snapshots_insert" on public.analysis_snapshots;
drop policy if exists "analysis_snapshots_update" on public.analysis_snapshots;

create policy "analysis_snapshots_insert" on public.analysis_snapshots
  for insert to authenticated
  with check (
    public.is_tenant_member(analysis_snapshots.tenant_id)
    and analysis_snapshots.created_by = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.id = analysis_snapshots.project_id
        and p.tenant_id = analysis_snapshots.tenant_id
    )
  );

create policy "analysis_snapshots_update" on public.analysis_snapshots
  for update to authenticated
  using (
    public.is_org_admin(analysis_snapshots.tenant_id)
  )
  with check (
    public.is_org_admin(analysis_snapshots.tenant_id)
    and exists (
      select 1
      from public.projects p
      where p.id = analysis_snapshots.project_id
        and p.tenant_id = analysis_snapshots.tenant_id
    )
  );

-- ---------------------------------------------------------------------------
-- toc_versions: tenant-scoped write checks with project/snapshot alignment
-- Keep immutable approach: update/delete only when current row is DRAFT.
-- ---------------------------------------------------------------------------

drop policy if exists "toc_versions_insert" on public.toc_versions;
drop policy if exists "toc_versions_update" on public.toc_versions;

create policy "toc_versions_insert" on public.toc_versions
  for insert to authenticated
  with check (
    public.is_tenant_member(toc_versions.tenant_id)
    and toc_versions.created_by = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.id = toc_versions.project_id
        and p.tenant_id = toc_versions.tenant_id
    )
    and exists (
      select 1
      from public.analysis_snapshots s
      where s.id = toc_versions.analysis_snapshot_id
        and s.tenant_id = toc_versions.tenant_id
        and s.project_id = toc_versions.project_id
    )
    and (
      toc_versions.linked_analysis_snapshot_id is null
      or exists (
        select 1
        from public.analysis_snapshots s2
        where s2.id = toc_versions.linked_analysis_snapshot_id
          and s2.tenant_id = toc_versions.tenant_id
          and s2.project_id = toc_versions.project_id
      )
    )
  );

create policy "toc_versions_update" on public.toc_versions
  for update to authenticated
  using (
    public.is_org_admin(toc_versions.tenant_id)
    and toc_versions.status = 'DRAFT'
  )
  with check (
    public.is_org_admin(toc_versions.tenant_id)
    and exists (
      select 1
      from public.projects p
      where p.id = toc_versions.project_id
        and p.tenant_id = toc_versions.tenant_id
    )
    and exists (
      select 1
      from public.analysis_snapshots s
      where s.id = toc_versions.analysis_snapshot_id
        and s.tenant_id = toc_versions.tenant_id
        and s.project_id = toc_versions.project_id
    )
    and (
      toc_versions.linked_analysis_snapshot_id is null
      or exists (
        select 1
        from public.analysis_snapshots s2
        where s2.id = toc_versions.linked_analysis_snapshot_id
          and s2.tenant_id = toc_versions.tenant_id
          and s2.project_id = toc_versions.project_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- toc_projections: tenant-scoped write checks with FK tenant/version alignment
-- ---------------------------------------------------------------------------

drop policy if exists "toc_projections_insert" on public.toc_projections;
drop policy if exists "toc_projections_update" on public.toc_projections;

create policy "toc_projections_insert" on public.toc_projections
  for insert to authenticated
  with check (
    public.is_org_admin(toc_projections.tenant_id)
    and exists (
      select 1
      from public.projects p
      where p.id = toc_projections.project_id
        and p.tenant_id = toc_projections.tenant_id
    )
    and exists (
      select 1
      from public.toc_versions v
      where v.id = toc_projections.toc_version_id
        and v.tenant_id = toc_projections.tenant_id
        and v.project_id = toc_projections.project_id
    )
    and exists (
      select 1
      from public.toc_nodes n
      where n.id = toc_projections.node_id
        and n.tenant_id = toc_projections.tenant_id
        and n.toc_version_id = toc_projections.toc_version_id
    )
    and (
      toc_projections.source_edge_id is null
      or exists (
        select 1
        from public.toc_edges e
        where e.id = toc_projections.source_edge_id
          and e.tenant_id = toc_projections.tenant_id
          and e.toc_version_id = toc_projections.toc_version_id
      )
    )
  );

create policy "toc_projections_update" on public.toc_projections
  for update to authenticated
  using (
    public.is_org_admin(toc_projections.tenant_id)
  )
  with check (
    public.is_org_admin(toc_projections.tenant_id)
    and exists (
      select 1
      from public.projects p
      where p.id = toc_projections.project_id
        and p.tenant_id = toc_projections.tenant_id
    )
    and exists (
      select 1
      from public.toc_versions v
      where v.id = toc_projections.toc_version_id
        and v.tenant_id = toc_projections.tenant_id
        and v.project_id = toc_projections.project_id
    )
    and exists (
      select 1
      from public.toc_nodes n
      where n.id = toc_projections.node_id
        and n.tenant_id = toc_projections.tenant_id
        and n.toc_version_id = toc_projections.toc_version_id
    )
    and (
      toc_projections.source_edge_id is null
      or exists (
        select 1
        from public.toc_edges e
        where e.id = toc_projections.source_edge_id
          and e.tenant_id = toc_projections.tenant_id
          and e.toc_version_id = toc_projections.toc_version_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- report_manifests: tenant-scoped write checks with FK tenant/project alignment
-- ---------------------------------------------------------------------------

drop policy if exists "report_manifests_insert" on public.report_manifests;
drop policy if exists "report_manifests_update" on public.report_manifests;

create policy "report_manifests_insert" on public.report_manifests
  for insert to authenticated
  with check (
    public.is_tenant_member(report_manifests.tenant_id)
    and report_manifests.created_by = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.id = report_manifests.project_id
        and p.tenant_id = report_manifests.tenant_id
    )
    and exists (
      select 1
      from public.toc_versions v
      where v.id = report_manifests.toc_version_id
        and v.tenant_id = report_manifests.tenant_id
        and v.project_id = report_manifests.project_id
    )
    and exists (
      select 1
      from public.analysis_snapshots s
      where s.id = report_manifests.analysis_snapshot_id
        and s.tenant_id = report_manifests.tenant_id
        and s.project_id = report_manifests.project_id
    )
  );

create policy "report_manifests_update" on public.report_manifests
  for update to authenticated
  using (
    public.is_org_admin(report_manifests.tenant_id)
  )
  with check (
    public.is_org_admin(report_manifests.tenant_id)
    and exists (
      select 1
      from public.projects p
      where p.id = report_manifests.project_id
        and p.tenant_id = report_manifests.tenant_id
    )
    and exists (
      select 1
      from public.toc_versions v
      where v.id = report_manifests.toc_version_id
        and v.tenant_id = report_manifests.tenant_id
        and v.project_id = report_manifests.project_id
    )
    and exists (
      select 1
      from public.analysis_snapshots s
      where s.id = report_manifests.analysis_snapshot_id
        and s.tenant_id = report_manifests.tenant_id
        and s.project_id = report_manifests.project_id
    )
  );

commit;
