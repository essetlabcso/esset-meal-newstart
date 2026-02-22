-- S0 schema verification checks (non-destructive)

with checks as (
  select 'toc_versions.linked_analysis_snapshot_id' as check_name,
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'toc_versions' and column_name = 'linked_analysis_snapshot_id'
         ) as pass
  union all
  select 'toc_nodes.primary_parent_id',
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'toc_nodes' and column_name = 'primary_parent_id'
         )
  union all
  select 'toc_nodes.primary_path_key',
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'toc_nodes' and column_name = 'primary_path_key'
         )
  union all
  select 'toc_edges.edge_kind',
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'toc_edges' and column_name = 'edge_kind'
         )
  union all
  select 'toc_projections.table',
         exists (
           select 1 from information_schema.tables
           where table_schema = 'public' and table_name = 'toc_projections'
         )
  union all
  select 'report_manifests.table',
         exists (
           select 1 from information_schema.tables
           where table_schema = 'public' and table_name = 'report_manifests'
         )
  union all
  select 'publish_toc_version.returns_jsonb',
         exists (
           select 1 from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname = 'publish_toc_version'
             and p.prorettype = 'jsonb'::regtype
         )
  union all
  select 'export_matrix_csv.returns_jsonb',
         exists (
           select 1 from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname = 'export_matrix_csv'
             and p.prorettype = 'jsonb'::regtype
         )
  union all
  select 'read_toc_projection_matrix.exists',
         exists (
           select 1 from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname = 'read_toc_projection_matrix'
         )
  union all
  select 'read_toc_projection_matrix.security_invoker',
         exists (
           select 1 from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname = 'read_toc_projection_matrix'
             and p.prosecdef = false
         )
  union all
  select 'export_matrix_csv.security_invoker',
         exists (
           select 1 from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname = 'export_matrix_csv'
             and p.prosecdef = false
         )
)
select json_build_object(
  'result', case when bool_and(pass) then 'PASS' else 'FAIL' end,
  'checks', json_agg(json_build_object('name', check_name, 'pass', pass) order by check_name)
) as proof
from checks;
