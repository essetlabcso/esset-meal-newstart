-- S0 publish atomic transaction integration test
-- Proves: TOC-PUB-01, TOC-PUB-02, SNAP-01

begin;

do $$
declare
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_org_a uuid;
  v_org_b uuid;
  v_project_a uuid;
  v_project_b uuid;
  v_snapshot_a uuid;
  v_snapshot_b uuid;
  v_draft_a uuid;
  v_goal_a uuid;
  v_outcome_a uuid;
  v_publish jsonb;
  v_cross jsonb;
  v_published uuid;
  v_new_draft uuid;
  v_freeze uuid;
  v_rows int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values
    (v_user_a, 's0_pub_a_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated'),
    (v_user_b, 's0_pub_b_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('S0 Publish Org A', v_user_a) returning id into v_org_a;
  insert into public.organizations (name, created_by) values ('S0 Publish Org B', v_user_b) returning id into v_org_b;

  insert into public.projects (tenant_id, title, created_by) values (v_org_a, 'S0 Publish Project A', v_user_a) returning id into v_project_a;
  insert into public.projects (tenant_id, title, created_by) values (v_org_b, 'S0 Publish Project B', v_user_b) returning id into v_project_b;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, source, created_by)
  values (v_org_a, v_project_a, 'S0 Publish Snapshot A', '{}'::jsonb, 'ANL module', v_user_a)
  returning id into v_snapshot_a;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, source, created_by)
  values (v_org_b, v_project_b, 'S0 Publish Snapshot B', '{}'::jsonb, 'ANL module', v_user_b)
  returning id into v_snapshot_b;

  -- Build a valid draft in org A
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.create_toc_draft(v_org_a, v_project_a, v_snapshot_a, null) into v_draft_a;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id, pos_x, pos_y)
  values (v_org_a, v_draft_a, 'GOAL', 'Goal A', v_user_a, null, 0, 0)
  returning id into v_goal_a;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id, pos_x, pos_y)
  values (v_org_a, v_draft_a, 'OUTCOME', 'Outcome A', v_user_a, v_goal_a, 200, 100)
  returning id into v_outcome_a;

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org_a, v_draft_a, v_goal_a, v_outcome_a, 'CONTRIBUTES_TO',
    'causal', 'Goal contributes to outcome', 'medium', 'none', v_user_a
  );

  select public.publish_toc_version_atomic(v_org_a, v_project_a, v_draft_a) into v_publish;
  if coalesce((v_publish ->> 'ok')::boolean, false) is false then
    reset role;
    raise exception 'S0 PUBLISH FAIL: publish_toc_version_atomic returned failure: %', v_publish::text;
  end if;

  v_published := (v_publish ->> 'published_version_id')::uuid;
  v_new_draft := (v_publish ->> 'new_draft_version_id')::uuid;
  v_freeze := (v_publish ->> 'linked_analysis_snapshot_id')::uuid;

  -- TOC-PUB-01 + SNAP-01: published row has published_at + linked freeze snapshot
  if not exists (
    select 1
    from public.toc_versions v
    where v.id = v_published
      and v.status = 'PUBLISHED'
      and v.published_at is not null
      and v.linked_analysis_snapshot_id = v_freeze
  ) then
    reset role;
    raise exception 'S0 PUBLISH FAIL: published row missing status/published_at/linked snapshot';
  end if;

  if not exists (
    select 1
    from public.analysis_snapshots s
    where s.id = v_freeze
      and s.tenant_id = v_org_a
      and s.project_id = v_project_a
  ) then
    reset role;
    raise exception 'S0 PUBLISH FAIL: freeze snapshot not created';
  end if;

  -- TOC-PUB-02: new draft exists with source_version_id lineage
  if not exists (
    select 1
    from public.toc_versions v
    where v.id = v_new_draft
      and v.status = 'DRAFT'
      and v.source_version_id = v_published
  ) then
    reset role;
    raise exception 'S0 PUBLISH FAIL: new draft missing COW lineage';
  end if;

  -- New draft is editable
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id, pos_x, pos_y)
  values (v_org_a, v_new_draft, 'OUTCOME', 'Editable New Draft Node', v_user_a, null, 250, 200);

  -- Old published version rejects edits as zero-row updates
  update public.toc_versions
  set version_label = 'v999'
  where id = v_published;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 PUBLISH FAIL: published toc_versions update affected % rows', v_rows;
  end if;

  update public.toc_nodes
  set title = 'Should Not Update'
  where toc_version_id = v_published;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 PUBLISH FAIL: published toc_nodes update affected % rows', v_rows;
  end if;

  -- Cross-tenant publish attempt returns NOT_FOUND semantics
  reset role;
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.publish_toc_version_atomic(v_org_a, v_project_a, v_new_draft) into v_cross;
  if coalesce((v_cross ->> 'ok')::boolean, true) is true then
    reset role;
    raise exception 'S0 PUBLISH FAIL: cross-tenant publish unexpectedly succeeded';
  end if;
  if coalesce(v_cross ->> 'code', '') <> 'NOT_FOUND' then
    reset role;
    raise exception 'S0 PUBLISH FAIL: cross-tenant publish did not return NOT_FOUND code (%).', coalesce(v_cross ->> 'code', '');
  end if;

  reset role;

  delete from public.toc_versions where project_id in (v_project_a, v_project_b);
  delete from public.analysis_snapshots where project_id in (v_project_a, v_project_b);
  delete from public.projects where id in (v_project_a, v_project_b);
  delete from public.org_memberships where org_id in (v_org_a, v_org_b);
  delete from public.organizations where id in (v_org_a, v_org_b);
  delete from auth.users where id in (v_user_a, v_user_b);
end
$$;

select json_build_object('result', 'PASS', 'test', 's0_publish_atomic_transaction') as proof;

rollback;
