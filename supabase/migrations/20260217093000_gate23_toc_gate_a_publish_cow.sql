-- Gate 23: ToC Gate A publish + immutable spine hardening
-- Adds missing spine fields and enforces Gate A publish blockers with copy-on-write.

alter table public.toc_versions
  add column if not exists source_version_id uuid null references public.toc_versions(id) on delete set null;

alter table public.toc_nodes
  add column if not exists created_by uuid references auth.users(id);

update public.toc_nodes n
set created_by = v.created_by
from public.toc_versions v
where n.toc_version_id = v.id
  and n.created_by is null;

alter table public.toc_nodes
  alter column created_by set default auth.uid();

alter table public.toc_nodes
  alter column created_by set not null;

alter table public.toc_edges
  add column if not exists created_by uuid references auth.users(id);

update public.toc_edges e
set created_by = v.created_by
from public.toc_versions v
where e.toc_version_id = v.id
  and e.created_by is null;

alter table public.toc_edges
  alter column created_by set default auth.uid();

alter table public.toc_edges
  alter column created_by set not null;

alter table public.toc_edges
  drop constraint if exists toc_edges_source_node_id_target_node_id_edge_type_key;

create unique index if not exists toc_edges_unique_per_version
on public.toc_edges (toc_version_id, source_node_id, target_node_id, edge_type);

create or replace function public.publish_toc_version(_tenant_id uuid, _project_id uuid, _version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _draft public.toc_versions%rowtype;
  _goal_count int;
  _orphan_count int;
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

  select count(*)
  into _goal_count
  from public.toc_nodes n
  where n.toc_version_id = _version_id
    and n.tenant_id = _tenant_id
    and n.node_type = 'GOAL';

  if _goal_count <> 1 then
    raise exception 'Gate A failed: exactly one GOAL node is required';
  end if;

  select count(*)
  into _orphan_count
  from public.toc_nodes n
  where n.toc_version_id = _version_id
    and n.tenant_id = _tenant_id
    and n.node_type <> 'GOAL'
    and not exists (
      select 1
      from public.toc_edges e
      where e.toc_version_id = _version_id
        and e.tenant_id = _tenant_id
        and (e.source_node_id = n.id or e.target_node_id = n.id)
    );

  if _orphan_count > 0 then
    raise exception 'Gate A failed: orphan nodes detected (%).', _orphan_count;
  end if;

  update public.toc_versions
  set status = 'PUBLISHED',
      published_at = now()
  where id = _version_id;

  _new_draft_id := public.create_toc_draft(
    _tenant_id,
    _project_id,
    _draft.analysis_snapshot_id,
    _version_id
  );

  update public.toc_versions
  set source_version_id = _version_id
  where id = _new_draft_id;

  return jsonb_build_object(
    'published_version_id', _version_id,
    'new_draft_version_id', _new_draft_id,
    'status', 'ok'
  );
end;
$$;
