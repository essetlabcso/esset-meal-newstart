-- S0 canonical slice enforcement (spec: docs/enhanced_master_spec_v0_1_18012026.md)
-- Rule families: ARCH-05..07, TOC-PUB-01/02, TOC-PROJ-01..04, GA-01..GA-08, RPT-01/02, AN-01..03, SEC-01..04

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Schema alignment for S0 contracts
-- ---------------------------------------------------------------------------

alter table public.toc_versions
  add column if not exists linked_analysis_snapshot_id uuid null references public.analysis_snapshots(id) on delete restrict;

update public.toc_versions
set linked_analysis_snapshot_id = analysis_snapshot_id
where linked_analysis_snapshot_id is null;

alter table public.toc_nodes
  add column if not exists primary_parent_id uuid null references public.toc_nodes(id) on delete set null;

alter table public.toc_nodes
  add column if not exists primary_path_key uuid[] null;

alter table public.toc_edges
  add column if not exists edge_kind text not null default 'causal';

alter table public.toc_edges
  add column if not exists mechanism text null;

alter table public.toc_edges
  add column if not exists confidence text not null default 'medium';

alter table public.toc_edges
  add column if not exists risk_flag text not null default 'none';

alter table public.toc_edges
  add column if not exists sentinel_indicator_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'toc_edges_edge_kind_check'
      and conrelid = 'public.toc_edges'::regclass
  ) then
    alter table public.toc_edges
      add constraint toc_edges_edge_kind_check
      check (edge_kind in ('causal', 'secondary_link', 'feedback'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'toc_edges_confidence_check'
      and conrelid = 'public.toc_edges'::regclass
  ) then
    alter table public.toc_edges
      add constraint toc_edges_confidence_check
      check (confidence in ('high', 'medium', 'low'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'toc_edges_risk_flag_check'
      and conrelid = 'public.toc_edges'::regclass
  ) then
    alter table public.toc_edges
      add constraint toc_edges_risk_flag_check
      check (risk_flag in ('none', 'high_risk'));
  end if;
end $$;

drop index if exists public.toc_edges_unique_per_version;
create unique index if not exists toc_edges_unique_per_kind
  on public.toc_edges (toc_version_id, source_node_id, target_node_id, edge_kind);

create table if not exists public.toc_projections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  toc_version_id uuid not null references public.toc_versions(id) on delete cascade,
  node_id uuid not null references public.toc_nodes(id) on delete cascade,
  path_key uuid[] not null,
  is_ghost boolean not null default false,
  source_edge_id uuid null references public.toc_edges(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique (toc_version_id, node_id, path_key, is_ghost)
);

create table if not exists public.report_manifests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  toc_version_id uuid not null references public.toc_versions(id) on delete cascade,
  analysis_snapshot_id uuid not null references public.analysis_snapshots(id) on delete restrict,
  time_window jsonb not null default '{}'::jsonb,
  export_type text not null,
  config_json jsonb not null default '{}'::jsonb,
  hash text not null,
  artifact_csv text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  constraint report_manifests_export_type_check check (export_type in ('donor_pack', 'community_pack', 'internal_pack', 'matrix_csv', 'toc_pdf'))
);

-- ---------------------------------------------------------------------------
-- RLS for new tables (SEC-01/02/03/04)
-- ---------------------------------------------------------------------------

alter table public.toc_projections enable row level security;
alter table public.report_manifests enable row level security;

drop policy if exists "toc_projections_select" on public.toc_projections;
drop policy if exists "toc_projections_insert" on public.toc_projections;
drop policy if exists "toc_projections_update" on public.toc_projections;
drop policy if exists "toc_projections_delete" on public.toc_projections;

create policy "toc_projections_select" on public.toc_projections
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "toc_projections_insert" on public.toc_projections
  for insert to authenticated
  with check (public.is_org_admin(tenant_id));

create policy "toc_projections_update" on public.toc_projections
  for update to authenticated
  using (public.is_org_admin(tenant_id))
  with check (public.is_org_admin(tenant_id));

create policy "toc_projections_delete" on public.toc_projections
  for delete to authenticated
  using (public.is_org_admin(tenant_id));

drop policy if exists "report_manifests_select" on public.report_manifests;
drop policy if exists "report_manifests_insert" on public.report_manifests;
drop policy if exists "report_manifests_update" on public.report_manifests;
drop policy if exists "report_manifests_delete" on public.report_manifests;

create policy "report_manifests_select" on public.report_manifests
  for select to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "report_manifests_insert" on public.report_manifests
  for insert to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy "report_manifests_update" on public.report_manifests
  for update to authenticated
  using (public.is_org_admin(tenant_id))
  with check (public.is_org_admin(tenant_id));

create policy "report_manifests_delete" on public.report_manifests
  for delete to authenticated
  using (public.is_org_admin(tenant_id));

-- ---------------------------------------------------------------------------
-- Deterministic projection builder (TOC-PROJ-01..04, ARCH-05..07)
-- ---------------------------------------------------------------------------

create or replace function public.rebuild_toc_projections(
  _tenant_id uuid,
  _project_id uuid,
  _toc_version_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tenant_member(_tenant_id) then
    raise exception 'Unauthorized: tenant access required';
  end if;

  with recursive primary_tree as (
    select
      n.id as node_id,
      n.primary_parent_id,
      array[n.id]::uuid[] as path_key
    from public.toc_nodes n
    where n.tenant_id = _tenant_id
      and n.toc_version_id = _toc_version_id
      and n.node_type = 'GOAL'

    union all

    select
      c.id as node_id,
      c.primary_parent_id,
      pt.path_key || c.id
    from public.toc_nodes c
    join primary_tree pt on pt.node_id = c.primary_parent_id
    where c.tenant_id = _tenant_id
      and c.toc_version_id = _toc_version_id
      and array_position(pt.path_key, c.id) is null
  )
  update public.toc_nodes n
  set primary_path_key = pt.path_key
  from primary_tree pt
  where n.id = pt.node_id
    and n.toc_version_id = _toc_version_id
    and n.tenant_id = _tenant_id;

  delete from public.toc_projections p
  where p.tenant_id = _tenant_id
    and p.project_id = _project_id
    and p.toc_version_id = _toc_version_id;

  insert into public.toc_projections (
    tenant_id, project_id, toc_version_id, node_id, path_key, is_ghost, source_edge_id, created_by
  )
  select
    _tenant_id, _project_id, _toc_version_id, n.id, n.primary_path_key, false, null, auth.uid()
  from public.toc_nodes n
  where n.tenant_id = _tenant_id
    and n.toc_version_id = _toc_version_id
    and n.primary_path_key is not null;

  insert into public.toc_projections (
    tenant_id, project_id, toc_version_id, node_id, path_key, is_ghost, source_edge_id, created_by
  )
  select
    _tenant_id,
    _project_id,
    _toc_version_id,
    child.id as node_id,
    (parent.primary_path_key || child.id)::uuid[] as ghost_path_key,
    true as is_ghost,
    e.id as source_edge_id,
    auth.uid()
  from public.toc_edges e
  join public.toc_nodes parent on parent.id = e.source_node_id
  join public.toc_nodes child on child.id = e.target_node_id
  where e.tenant_id = _tenant_id
    and e.toc_version_id = _toc_version_id
    and e.edge_kind = 'secondary_link'
    and parent.primary_path_key is not null
  on conflict (toc_version_id, node_id, path_key, is_ghost) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Gate A validators (GA-01..GA-08)
-- ---------------------------------------------------------------------------

create or replace function public.ga_rls_baseline_ok()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _tbl text;
  _required_tables text[] := array[
    'analysis_snapshots',
    'toc_versions',
    'toc_nodes',
    'toc_edges',
    'toc_assumptions',
    'toc_edge_assumptions',
    'toc_projections',
    'report_manifests'
  ];
begin
  foreach _tbl in array _required_tables loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = _tbl
        and c.relrowsecurity = true
    ) then
      return false;
    end if;

    if not exists (
      select 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = _tbl
    ) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

create or replace function public.validate_gate_a(
  _tenant_id uuid,
  _project_id uuid,
  _version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _errors jsonb := '[]'::jsonb;
  _goal_count int := 0;
  _orphan_count int := 0;
  _type_chain_violations int := 0;
  _causal_cycle_count int := 0;
  _dup_edge_count int := 0;
  _missing_mechanism_count int := 0;
  _missing_sentinel_count int := 0;
begin
  -- GA-01
  select count(*) into _goal_count
  from public.toc_nodes n
  where n.tenant_id = _tenant_id
    and n.toc_version_id = _version_id
    and n.node_type = 'GOAL';

  if _goal_count <> 1 then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-01',
      'code', 'GA_ERR_GOAL_COUNT',
      'message', 'Exactly one goal node is required'
    ));
  end if;

  -- GA-02
  select count(*) into _orphan_count
  from public.toc_nodes n
  left join public.toc_nodes p
    on p.id = n.primary_parent_id
    and p.toc_version_id = n.toc_version_id
    and p.tenant_id = n.tenant_id
  where n.tenant_id = _tenant_id
    and n.toc_version_id = _version_id
    and n.node_type <> 'GOAL'
    and (n.primary_parent_id is null or p.id is null);

  if _orphan_count > 0 then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-02',
      'code', 'GA_ERR_ORPHANS',
      'message', 'Non-goal nodes must have exactly one valid primary parent'
    ));
  end if;

  -- GA-03
  select count(*) into _type_chain_violations
  from public.toc_nodes c
  join public.toc_nodes p on p.id = c.primary_parent_id
  where c.tenant_id = _tenant_id
    and c.toc_version_id = _version_id
    and (
      (c.node_type = 'OUTCOME' and p.node_type <> 'GOAL') or
      (c.node_type = 'OUTPUT' and p.node_type <> 'OUTCOME') or
      (c.node_type = 'ACTIVITY' and p.node_type <> 'OUTPUT')
    );

  if _type_chain_violations > 0 then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-03',
      'code', 'GA_ERR_TYPE_CHAIN',
      'message', 'Node types must follow goal->outcome->output->activity hierarchy'
    ));
  end if;

  -- GA-04
  with recursive walk as (
    select
      e.source_node_id as start_id,
      e.target_node_id as current_id,
      array[e.source_node_id, e.target_node_id]::uuid[] as path_ids
    from public.toc_edges e
    where e.tenant_id = _tenant_id
      and e.toc_version_id = _version_id
      and e.edge_kind = 'causal'

    union all

    select
      w.start_id,
      e.target_node_id as current_id,
      w.path_ids || e.target_node_id
    from walk w
    join public.toc_edges e
      on e.source_node_id = w.current_id
     and e.tenant_id = _tenant_id
     and e.toc_version_id = _version_id
     and e.edge_kind = 'causal'
    where array_position(w.path_ids, e.target_node_id) is null
  )
  select count(*) into _causal_cycle_count
  from walk w
  join public.toc_edges e
    on e.source_node_id = w.current_id
   and e.target_node_id = w.start_id
   and e.tenant_id = _tenant_id
   and e.toc_version_id = _version_id
   and e.edge_kind = 'causal';

  if _causal_cycle_count > 0 then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-04',
      'code', 'GA_ERR_CAUSAL_CYCLE',
      'message', 'Causal edge graph must be acyclic (feedback excluded)'
    ));
  end if;

  -- GA-05
  select count(*) into _dup_edge_count
  from (
    select source_node_id, target_node_id, edge_kind, count(*) as c
    from public.toc_edges e
    where e.tenant_id = _tenant_id
      and e.toc_version_id = _version_id
    group by source_node_id, target_node_id, edge_kind
    having count(*) > 1
  ) d;

  if _dup_edge_count > 0 then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-05',
      'code', 'GA_ERR_DUP_EDGE',
      'message', 'Duplicate edges are not allowed per version and edge kind'
    ));
  end if;

  -- GA-06
  select count(*) into _missing_mechanism_count
  from public.toc_edges e
  where e.tenant_id = _tenant_id
    and e.toc_version_id = _version_id
    and e.edge_kind = 'causal'
    and nullif(trim(coalesce(e.mechanism, '')), '') is null;

  if _missing_mechanism_count > 0 then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-06',
      'code', 'GA_ERR_EDGE_MECH',
      'message', 'All causal edges must include mechanism text'
    ));
  end if;

  -- GA-07
  select count(*) into _missing_sentinel_count
  from public.toc_edges e
  where e.tenant_id = _tenant_id
    and e.toc_version_id = _version_id
    and e.edge_kind = 'causal'
    and (e.confidence = 'low' or e.risk_flag = 'high_risk')
    and e.sentinel_indicator_id is null;

  if _missing_sentinel_count > 0 then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-07',
      'code', 'GA_ERR_SENTINEL',
      'message', 'Low-confidence/high-risk causal edges require sentinel indicator'
    ));
  end if;

  -- GA-08
  if not public.ga_rls_baseline_ok() then
    _errors := _errors || jsonb_build_array(jsonb_build_object(
      'rule_id', 'GA-08',
      'code', 'GA_ERR_RLS_BASELINE',
      'message', 'RLS baseline/policy lint failed'
    ));
  end if;

  return jsonb_build_object(
    'ok', jsonb_array_length(_errors) = 0,
    'errors', _errors
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Strict copy-on-write draft creation (align to new model)
-- ---------------------------------------------------------------------------

create or replace function public.create_toc_draft(
  _tenant_id uuid,
  _project_id uuid,
  _analysis_snapshot_id uuid,
  _from_version_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _new_version_id uuid;
  _next_ver int;
  _r record;
  _new_node_id uuid;
  _new_edge_id uuid;
begin
  if not public.is_tenant_member(_tenant_id) then
    raise exception 'Unauthorized: Not a member of this tenant';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = _project_id
      and tenant_id = _tenant_id
  ) then
    raise exception 'Project not found or does not belong to tenant';
  end if;

  if not exists (
    select 1
    from public.analysis_snapshots
    where id = _analysis_snapshot_id
      and tenant_id = _tenant_id
      and project_id = _project_id
  ) then
    raise exception 'Analysis snapshot not found or does not belong to tenant/project';
  end if;

  if exists (
    select 1
    from public.toc_versions
    where tenant_id = _tenant_id
      and project_id = _project_id
      and status = 'DRAFT'
  ) then
    raise exception 'A draft already exists for this project';
  end if;

  select coalesce(max(version_number), 0) + 1
  into _next_ver
  from public.toc_versions
  where tenant_id = _tenant_id
    and project_id = _project_id;

  insert into public.toc_versions (
    tenant_id, project_id, analysis_snapshot_id, linked_analysis_snapshot_id,
    status, version_number, version_label, created_by, source_version_id
  )
  values (
    _tenant_id, _project_id, _analysis_snapshot_id, null,
    'DRAFT', _next_ver, format('DRAFT-%s', _next_ver), auth.uid(), _from_version_id
  )
  returning id into _new_version_id;

  if _from_version_id is null then
    return _new_version_id;
  end if;

  if not exists (
    select 1 from public.toc_versions
    where id = _from_version_id
      and tenant_id = _tenant_id
      and project_id = _project_id
  ) then
    raise exception 'Source version not found or does not belong to tenant/project';
  end if;

  create temp table _node_map (
    old_id uuid not null,
    new_id uuid not null
  ) on commit drop;

  create temp table _edge_map (
    old_id uuid not null,
    new_id uuid not null
  ) on commit drop;

  for _r in
    select *
    from public.toc_nodes
    where toc_version_id = _from_version_id
      and tenant_id = _tenant_id
  loop
    insert into public.toc_nodes (
      tenant_id, toc_version_id, node_type, title, description, metadata, pos_x, pos_y, created_by
    )
    values (
      _tenant_id, _new_version_id, _r.node_type, _r.title, _r.description, _r.metadata, _r.pos_x, _r.pos_y, auth.uid()
    )
    returning id into _new_node_id;

    insert into _node_map (old_id, new_id) values (_r.id, _new_node_id);
  end loop;

  -- copy primary-parent relationships
  update public.toc_nodes n
  set primary_parent_id = nm_parent.new_id
  from _node_map nm_self
  left join _node_map nm_parent on nm_parent.old_id = (
    select old.primary_parent_id
    from public.toc_nodes old
    where old.id = nm_self.old_id
  )
  where n.id = nm_self.new_id
    and n.toc_version_id = _new_version_id
    and n.tenant_id = _tenant_id;

  -- copy primary paths from source (rebuilt on publish; this keeps draft continuity)
  update public.toc_nodes n
  set primary_path_key = src.primary_path_key
  from _node_map nm
  join public.toc_nodes src on src.id = nm.old_id
  where n.id = nm.new_id
    and n.toc_version_id = _new_version_id
    and n.tenant_id = _tenant_id;

  insert into public.toc_assumptions (
    tenant_id, toc_version_id, node_id, assumption_text, risk_level
  )
  select
    _tenant_id, _new_version_id, nm.new_id, a.assumption_text, a.risk_level
  from public.toc_assumptions a
  join _node_map nm on nm.old_id = a.node_id
  where a.toc_version_id = _from_version_id
    and a.tenant_id = _tenant_id;

  for _r in
    select e.*, nm_s.new_id as new_source, nm_t.new_id as new_target
    from public.toc_edges e
    join _node_map nm_s on nm_s.old_id = e.source_node_id
    join _node_map nm_t on nm_t.old_id = e.target_node_id
    where e.toc_version_id = _from_version_id
      and e.tenant_id = _tenant_id
  loop
    insert into public.toc_edges (
      tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
      edge_kind, mechanism, confidence, risk_flag, sentinel_indicator_id, created_by
    )
    values (
      _tenant_id, _new_version_id, _r.new_source, _r.new_target, _r.edge_type,
      _r.edge_kind, _r.mechanism, _r.confidence, _r.risk_flag, _r.sentinel_indicator_id, auth.uid()
    )
    returning id into _new_edge_id;

    insert into _edge_map (old_id, new_id) values (_r.id, _new_edge_id);
  end loop;

  insert into public.toc_edge_assumptions (
    tenant_id, toc_version_id, edge_id, assumption_text, risk_level
  )
  select
    _tenant_id, _new_version_id, em.new_id, ea.assumption_text, ea.risk_level
  from public.toc_edge_assumptions ea
  join _edge_map em on em.old_id = ea.edge_id
  where ea.toc_version_id = _from_version_id
    and ea.tenant_id = _tenant_id;

  return _new_version_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Publish transaction: Gate A + freeze snapshot + immutable publish + COW
-- ---------------------------------------------------------------------------

create or replace function public.publish_toc_version(
  _tenant_id uuid,
  _project_id uuid,
  _version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _draft public.toc_versions%rowtype;
  _gate jsonb;
  _gate_codes text;
  _gate_errors jsonb;
  _freeze_snapshot_id uuid;
  _new_draft_id uuid;
begin
  if not public.is_org_admin(_tenant_id) then
    raise exception 'Unauthorized: Requires org admin role';
  end if;

  select *
  into _draft
  from public.toc_versions
  where id = _version_id
    and tenant_id = _tenant_id
    and project_id = _project_id
    and status = 'DRAFT'
  for update;

  if not found then
    raise exception 'Draft version not found or ownership mismatch (tenant_id/project_id/status)';
  end if;

  _gate := public.validate_gate_a(_tenant_id, _project_id, _version_id);
  _gate_errors := coalesce(_gate -> 'errors', '[]'::jsonb);

  if coalesce((_gate ->> 'ok')::boolean, false) is false then
    select string_agg(e ->> 'code', ',')
    into _gate_codes
    from jsonb_array_elements(_gate_errors) e;

    raise exception 'Gate A failed [%]', coalesce(_gate_codes, 'GA_ERR_UNKNOWN')
      using detail = _gate_errors::text;
  end if;

  -- TOC-PUB-01 step 2: freeze analysis snapshot and bind published version
  insert into public.analysis_snapshots (
    tenant_id, project_id, title, snapshot, created_by
  )
  select
    _tenant_id,
    _project_id,
    'Publish Freeze v' || _draft.version_number::text,
    s.snapshot,
    auth.uid()
  from public.analysis_snapshots s
  where s.id = _draft.analysis_snapshot_id
    and s.tenant_id = _tenant_id
    and s.project_id = _project_id
  returning id into _freeze_snapshot_id;

  if _freeze_snapshot_id is null then
    raise exception 'Publish failed: could not create linked analysis freeze snapshot';
  end if;

  update public.toc_versions
  set status = 'PUBLISHED',
      published_at = now(),
      linked_analysis_snapshot_id = _freeze_snapshot_id
  where id = _version_id;

  perform public.rebuild_toc_projections(_tenant_id, _project_id, _version_id);

  _new_draft_id := public.create_toc_draft(
    _tenant_id,
    _project_id,
    _freeze_snapshot_id,
    _version_id
  );

  update public.toc_versions
  set source_version_id = _version_id
  where id = _new_draft_id;

  return jsonb_build_object(
    'published_version_id', _version_id,
    'new_draft_version_id', _new_draft_id,
    'linked_analysis_snapshot_id', _freeze_snapshot_id,
    'gate_results', _gate_errors,
    'rule_ids', jsonb_build_array(
      'TOC-PUB-01', 'TOC-PUB-02',
      'GA-01', 'GA-02', 'GA-03', 'GA-04', 'GA-05', 'GA-06', 'GA-07', 'GA-08'
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Snapshot-bound deterministic export + report manifest (RPT-01/RPT-02, AN-*)
-- ---------------------------------------------------------------------------

create or replace function public.export_matrix_csv(
  _tenant_id uuid,
  _project_id uuid,
  _toc_version_id uuid,
  _time_window jsonb default '{}'::jsonb,
  _config_json jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _published public.toc_versions%rowtype;
  _snapshot_id uuid;
  _manifest_id uuid;
  _csv_header text;
  _csv_rows text;
  _csv_text text;
  _hash text;
begin
  if not public.is_tenant_member(_tenant_id) then
    raise exception 'Unauthorized: tenant membership required';
  end if;

  if coalesce(_config_json ->> 'allocation_mode', '') = 'weighted' then
    raise exception 'AN-01 violation: weighted allocation is not permitted';
  end if;

  select *
  into _published
  from public.toc_versions v
  where v.id = _toc_version_id
    and v.tenant_id = _tenant_id
    and v.project_id = _project_id
    and v.status = 'PUBLISHED';

  if not found then
    raise exception 'Export requires a published ToC version';
  end if;

  _snapshot_id := _published.linked_analysis_snapshot_id;
  if _snapshot_id is null then
    raise exception 'RPT-02 violation: published version is missing linked_analysis_snapshot_id';
  end if;

  perform public.rebuild_toc_projections(_tenant_id, _project_id, _toc_version_id);

  _csv_header := 'path_key,node_id,node_type,node_title,primary_parent_id,is_ghost,source_edge_id,linked_analysis_snapshot_id,reconciliation_footnote';

  select coalesce(string_agg(
    format(
      '%s,%s,%s,%s,%s,%s,%s,%s,%s',
      '"' || array_to_string(p.path_key, '>') || '"',
      p.node_id::text,
      n.node_type,
      '"' || replace(coalesce(n.title, ''), '"', '""') || '"',
      coalesce(n.primary_parent_id::text, ''),
      case when p.is_ghost then 'true' else 'false' end,
      coalesce(p.source_edge_id::text, ''),
      _snapshot_id::text,
      '"' || case when p.is_ghost then 'Shared node projection; de-duplicated by GUID (AN-02/AN-03)' else '' end || '"'
    ),
    E'\n'
    order by p.path_key, p.is_ghost, p.node_id
  ), '')
  into _csv_rows
  from public.toc_projections p
  join public.toc_nodes n on n.id = p.node_id
  where p.tenant_id = _tenant_id
    and p.project_id = _project_id
    and p.toc_version_id = _toc_version_id;

  _csv_text := _csv_header || E'\n' || _csv_rows;
  _hash := encode(digest(_csv_text, 'sha256'), 'hex');

  insert into public.report_manifests (
    tenant_id, project_id, toc_version_id, analysis_snapshot_id,
    time_window, export_type, config_json, hash, artifact_csv, created_by
  )
  values (
    _tenant_id, _project_id, _toc_version_id, _snapshot_id,
    _time_window, 'matrix_csv', _config_json, _hash, _csv_text, auth.uid()
  )
  returning id into _manifest_id;

  return jsonb_build_object(
    'manifest_id', _manifest_id,
    'toc_version_id', _toc_version_id,
    'analysis_snapshot_id', _snapshot_id,
    'export_type', 'matrix_csv',
    'hash', _hash,
    'csv_text', _csv_text,
    'rule_ids', jsonb_build_array('RPT-01', 'RPT-02', 'AN-01', 'AN-02', 'AN-03', 'TOC-PROJ-04')
  );
end;
$$;

commit;
