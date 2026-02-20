-- Phase E (Option C): deterministic projection + matrix read-model
-- TOC-PROJ-01..04, TOC-MP-01/02

-- Explicit field mapping used by this read-model:
-- - primary lineage relation: public.toc_nodes.primary_parent_id
-- - secondary ghost link: public.toc_edges.edge_kind = 'secondary_link'
-- - deterministic node order token: public.toc_nodes.created_at + public.toc_nodes.id
-- - deterministic ghost edge tie-breaker: public.toc_edges.created_at + public.toc_edges.id
create or replace function public.read_toc_projection_matrix(
  _tenant_id uuid,
  _project_id uuid,
  _toc_version_id uuid
)
returns table (
  tenant_id uuid,
  project_id uuid,
  toc_version_id uuid,
  node_id uuid,
  primary_path_key uuid[],
  path_key uuid[],
  path_sort_key text,
  row_kind text,
  is_ghost boolean,
  source_edge_id uuid,
  source_edge_kind text,
  projection_parent_id uuid,
  primary_parent_id uuid,
  goal_id uuid,
  outcome_id uuid,
  output_id uuid,
  depth int,
  node_type text,
  node_title text,
  node_description text,
  node_narrative text
)
language sql
security invoker
set search_path = public, pg_catalog
as $$
with recursive scoped_version as (
  select v.id
  from public.toc_versions v
  where v.id = _toc_version_id
    and v.tenant_id = _tenant_id
    and v.project_id = _project_id
    and public.is_tenant_member(v.tenant_id)
),
node_base as (
  select
    n.id,
    n.primary_parent_id,
    n.node_type,
    n.title,
    n.description,
    n.narrative,
    n.created_at,
    to_char(n.created_at at time zone 'UTC', 'YYYYMMDDHH24MISSUS') || ':' || n.id::text as node_order_token
  from public.toc_nodes n
  join scoped_version sv on sv.id = n.toc_version_id
  where n.tenant_id = _tenant_id
    and n.toc_version_id = _toc_version_id
),
primary_tree as (
  select
    n.id as node_id,
    n.primary_parent_id,
    array[n.id]::uuid[] as primary_path_key,
    array[n.node_order_token]::text[] as sort_tokens
  from node_base n
  where n.node_type = 'GOAL'

  union all

  select
    c.id as node_id,
    c.primary_parent_id,
    (pt.primary_path_key || c.id)::uuid[] as primary_path_key,
    (pt.sort_tokens || c.node_order_token)::text[] as sort_tokens
  from node_base c
  join primary_tree pt on pt.node_id = c.primary_parent_id
  where array_position(pt.primary_path_key, c.id) is null
),
primary_rows as (
  select
    pt.node_id,
    pt.primary_path_key,
    pt.primary_path_key as path_key,
    array_to_string(pt.sort_tokens, '~')
      || '|0|00000000000000000000:00000000-0000-0000-0000-000000000000|node:'
      || pt.node_id::text as path_sort_key,
    'primary'::text as row_kind,
    false as is_ghost,
    null::uuid as source_edge_id,
    null::text as source_edge_kind,
    nb.primary_parent_id as projection_parent_id,
    nb.primary_parent_id,
    pt.primary_path_key[1] as goal_id,
    case when cardinality(pt.primary_path_key) >= 2 then pt.primary_path_key[2] else null end as outcome_id,
    case when cardinality(pt.primary_path_key) >= 3 then pt.primary_path_key[3] else null end as output_id,
    cardinality(pt.primary_path_key) as depth
  from primary_tree pt
  join node_base nb on nb.id = pt.node_id
),
ghost_seed as (
  select
    child.id as node_id,
    child.primary_parent_id,
    child_tree.primary_path_key as primary_path_key,
    (parent_tree.primary_path_key || child.id)::uuid[] as ghost_path_key,
    (parent_tree.sort_tokens || child.node_order_token)::text[] as ghost_sort_tokens,
    e.id as source_edge_id,
    e.created_at as edge_created_at,
    parent.id as projection_parent_id
  from public.toc_edges e
  join scoped_version sv on sv.id = e.toc_version_id
  join node_base parent on parent.id = e.source_node_id
  join node_base child on child.id = e.target_node_id
  join primary_tree parent_tree on parent_tree.node_id = parent.id
  join primary_tree child_tree on child_tree.node_id = child.id
  where e.tenant_id = _tenant_id
    and e.toc_version_id = _toc_version_id
    and e.edge_kind = 'secondary_link'
),
ghost_rows as (
  select
    gs.node_id,
    gs.primary_path_key,
    gs.ghost_path_key as path_key,
    array_to_string(gs.ghost_sort_tokens, '~')
      || '|1|'
      || to_char(gs.edge_created_at at time zone 'UTC', 'YYYYMMDDHH24MISSUS')
      || ':' || gs.source_edge_id::text
      || '|node:' || gs.node_id::text
      || '|parent:' || gs.projection_parent_id::text as path_sort_key,
    'ghost_secondary'::text as row_kind,
    true as is_ghost,
    gs.source_edge_id,
    'secondary_link'::text as source_edge_kind,
    gs.projection_parent_id,
    gs.primary_parent_id,
    gs.ghost_path_key[1] as goal_id,
    case when cardinality(gs.ghost_path_key) >= 2 then gs.ghost_path_key[2] else null end as outcome_id,
    case when cardinality(gs.ghost_path_key) >= 3 then gs.ghost_path_key[3] else null end as output_id,
    cardinality(gs.ghost_path_key) as depth
  from ghost_seed gs
),
all_rows as (
  select * from primary_rows
  union all
  select * from ghost_rows
)
select
  _tenant_id as tenant_id,
  _project_id as project_id,
  _toc_version_id as toc_version_id,
  r.node_id,
  r.primary_path_key,
  r.path_key,
  r.path_sort_key,
  r.row_kind,
  r.is_ghost,
  r.source_edge_id,
  r.source_edge_kind,
  r.projection_parent_id,
  r.primary_parent_id,
  r.goal_id,
  r.outcome_id,
  r.output_id,
  r.depth,
  nb.node_type,
  nb.title as node_title,
  nb.description as node_description,
  nb.narrative as node_narrative
from all_rows r
join node_base nb on nb.id = r.node_id
order by
  r.path_sort_key,
  r.row_kind,
  r.node_id,
  coalesce(r.projection_parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(r.source_edge_id, '00000000-0000-0000-0000-000000000000'::uuid);
$$;

alter table public.report_manifests
  add column if not exists csv_hash text;

alter table public.report_manifests
  add column if not exists config_hash text;

alter table public.report_manifests
  add column if not exists row_count integer;

alter table public.report_manifests
  add column if not exists schema_version text;

alter table public.report_manifests
  add column if not exists generated_at timestamptz;

update public.report_manifests
set csv_hash = coalesce(csv_hash, hash)
where csv_hash is null;

update public.report_manifests
set config_hash = coalesce(config_hash, encode(extensions.digest(convert_to(config_json::text, 'UTF8'), 'sha256'), 'hex'))
where config_hash is null;

update public.report_manifests
set row_count = coalesce(row_count, 0)
where row_count is null;

update public.report_manifests
set schema_version = coalesce(schema_version, 'f1_matrix_csv_v1')
where schema_version is null;

update public.report_manifests
set generated_at = coalesce(generated_at, created_at, now())
where generated_at is null;

alter table public.report_manifests
  alter column csv_hash set not null;

alter table public.report_manifests
  alter column config_hash set not null;

alter table public.report_manifests
  alter column row_count set not null;

alter table public.report_manifests
  alter column schema_version set not null;

alter table public.report_manifests
  alter column generated_at set not null;

alter table public.report_manifests
  alter column row_count set default 0;

alter table public.report_manifests
  alter column schema_version set default 'f1_matrix_csv_v1';

alter table public.report_manifests
  alter column generated_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'report_manifests_row_count_nonnegative'
      and conrelid = 'public.report_manifests'::regclass
  ) then
    alter table public.report_manifests
      add constraint report_manifests_row_count_nonnegative check (row_count >= 0);
  end if;
end $$;

create or replace function public.export_matrix_csv(
  _tenant_id uuid,
  _project_id uuid,
  _toc_version_id uuid,
  _analysis_snapshot_id uuid,
  _window_start timestamptz,
  _window_end timestamptz,
  _config_json jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  _published public.toc_versions%rowtype;
  _snapshot_id uuid;
  _time_window jsonb;
  _manifest_id uuid;
  _csv_header text;
  _csv_rows text;
  _csv_text text;
  _csv_hash text;
  _config_hash text;
  _hash text;
  _row_count integer;
  _schema_version text := 'f1_matrix_csv_v1';
begin
  if not public.is_tenant_member(_tenant_id) then
    raise exception 'Unauthorized: tenant membership required';
  end if;

  if _analysis_snapshot_id is null then
    raise exception 'analysis_snapshot_id is required';
  end if;

  if _window_start is null or _window_end is null then
    raise exception 'window_start and window_end are required';
  end if;

  if _window_end < _window_start then
    raise exception 'window_end must be greater than or equal to window_start';
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

  if _analysis_snapshot_id <> _snapshot_id then
    raise exception 'Snapshot mismatch: supplied analysis_snapshot_id does not match published linked snapshot';
  end if;

  _time_window := jsonb_build_object(
    'window_start', to_char(_window_start at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'window_end', to_char(_window_end at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );

  _csv_header := 'path_key,node_id,node_type,node_title,primary_parent_id,is_ghost,source_edge_id,linked_analysis_snapshot_id,reconciliation_footnote';

  select coalesce(string_agg(
    format(
      '%s,%s,%s,%s,%s,%s,%s,%s,%s',
      '"' || array_to_string(p.path_key, '>') || '"',
      p.node_id::text,
      p.node_type,
      '"' || replace(coalesce(p.node_title, ''), '"', '""') || '"',
      coalesce(p.primary_parent_id::text, ''),
      case when p.row_kind = 'ghost_secondary' then 'true' else 'false' end,
      coalesce(p.source_edge_id::text, ''),
      _snapshot_id::text,
      '"' || case when p.row_kind = 'ghost_secondary' then 'Shared node projection; de-duplicated by GUID (AN-02/AN-03)' else '' end || '"'
    ),
    E'\n'
    order by
      p.path_sort_key,
      p.row_kind,
      p.node_id,
      coalesce(p.projection_parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(p.source_edge_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ), '')
  into _csv_rows
  from public.read_toc_projection_matrix(_tenant_id, _project_id, _toc_version_id) p;

  select count(*)
  into _row_count
  from public.read_toc_projection_matrix(_tenant_id, _project_id, _toc_version_id) p;

  _csv_text := _csv_header || E'\n' || _csv_rows;
  _csv_hash := encode(extensions.digest(convert_to(_csv_text, 'UTF8'), 'sha256'), 'hex');
  _config_hash := encode(extensions.digest(convert_to(_config_json::text, 'UTF8'), 'sha256'), 'hex');
  _hash := encode(extensions.digest(
    convert_to(
      _csv_hash || '|' || _config_hash || '|' || _toc_version_id::text || '|' || _snapshot_id::text || '|'
      || (_time_window ->> 'window_start') || '|' || (_time_window ->> 'window_end') || '|' || _schema_version,
      'UTF8'
    ),
    'sha256'
  ), 'hex');

  insert into public.report_manifests (
    tenant_id, project_id, toc_version_id, analysis_snapshot_id,
    time_window, export_type, config_json, csv_hash, config_hash, hash, row_count, schema_version, generated_at, artifact_csv, created_by
  )
  values (
    _tenant_id, _project_id, _toc_version_id, _snapshot_id,
    _time_window, 'matrix_csv', _config_json, _csv_hash, _config_hash, _hash, _row_count, _schema_version, now(), _csv_text, auth.uid()
  )
  returning id into _manifest_id;

  return jsonb_build_object(
    'manifest_id', _manifest_id,
    'toc_version_id', _toc_version_id,
    'analysis_snapshot_id', _snapshot_id,
    'export_type', 'matrix_csv',
    'csv_hash', _csv_hash,
    'config_hash', _config_hash,
    'hash', _hash,
    'row_count', _row_count,
    'schema_version', _schema_version,
    'time_window', _time_window,
    'csv_text', _csv_text,
    'rule_ids', jsonb_build_array('RPT-01', 'RPT-02', 'AN-01', 'AN-02', 'AN-03', 'TOC-PROJ-01', 'TOC-PROJ-02', 'TOC-PROJ-03', 'TOC-PROJ-04')
  );
end;
$$;
