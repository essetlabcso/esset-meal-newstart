-- S0 publish atomic RPC: snapshot freeze + publish + COW draft (no Gate A reads here)

begin;

create or replace function public.publish_toc_version_atomic(
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
  _freeze_snapshot_id uuid;
  _new_draft_id uuid;
begin
  if not public.is_org_admin(_tenant_id) then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_FOUND',
      'message', 'Draft not found'
    );
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
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_FOUND',
      'message', 'Draft not found'
    );
  end if;

  insert into public.analysis_snapshots (
    tenant_id, project_id, title, snapshot, source, created_by
  )
  select
    _tenant_id,
    _project_id,
    'Publish Freeze v' || coalesce(_draft.version_number, 0)::text,
    s.snapshot,
    coalesce(s.source, 'ANL module'),
    auth.uid()
  from public.analysis_snapshots s
  where s.id = _draft.analysis_snapshot_id
    and s.tenant_id = _tenant_id
    and s.project_id = _project_id
  returning id into _freeze_snapshot_id;

  if _freeze_snapshot_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_FOUND',
      'message', 'Draft not found'
    );
  end if;

  update public.toc_versions
  set status = 'PUBLISHED',
      published_at = now(),
      linked_analysis_snapshot_id = _freeze_snapshot_id
  where id = _version_id
    and tenant_id = _tenant_id
    and project_id = _project_id
    and status = 'DRAFT';

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_FOUND',
      'message', 'Draft not found'
    );
  end if;

  perform public.rebuild_toc_projections(_tenant_id, _project_id, _version_id);

  _new_draft_id := public.create_toc_draft(
    _tenant_id,
    _project_id,
    _freeze_snapshot_id,
    _version_id
  );

  update public.toc_versions
  set source_version_id = _version_id
  where id = _new_draft_id
    and tenant_id = _tenant_id
    and project_id = _project_id;

  return jsonb_build_object(
    'ok', true,
    'published_version_id', _version_id,
    'new_draft_version_id', _new_draft_id,
    'linked_analysis_snapshot_id', _freeze_snapshot_id,
    'rule_ids', jsonb_build_array('TOC-PUB-01', 'TOC-PUB-02', 'SNAP-01')
  );
exception when others then
  return jsonb_build_object(
    'ok', false,
    'code', 'PUBLISH_TXN_FAILED',
    'message', 'Publish transaction failed'
  );
end;
$$;

commit;
