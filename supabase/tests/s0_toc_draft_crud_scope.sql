-- S0 C1: draft CRUD scope + immutability guards
-- Proves:
-- 1) cross-tenant reads return 0 rows (invisible wall)
-- 2) writes against published versions are no-op (0 rows)

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
  v_published_a uuid;
  v_goal_a uuid;
  v_outcome_a uuid;
  v_count int;
  v_rows int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values
    (v_user_a, 's0_c1_a_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated'),
    (v_user_b, 's0_c1_b_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('S0 C1 Org A', v_user_a) returning id into v_org_a;
  insert into public.organizations (name, created_by) values ('S0 C1 Org B', v_user_b) returning id into v_org_b;

  insert into public.projects (tenant_id, title, created_by)
  values (v_org_a, 'S0 C1 Project A', v_user_a)
  returning id into v_project_a;

  insert into public.projects (tenant_id, title, created_by)
  values (v_org_b, 'S0 C1 Project B', v_user_b)
  returning id into v_project_b;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by, source)
  values (v_org_a, v_project_a, 'S0 C1 Snapshot A', '{}'::jsonb, v_user_a, 'ANL module')
  returning id into v_snapshot_a;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by, source)
  values (v_org_b, v_project_b, 'S0 C1 Snapshot B', '{}'::jsonb, v_user_b, 'ANL module')
  returning id into v_snapshot_b;

  insert into public.toc_versions (
    tenant_id, project_id, analysis_snapshot_id, linked_analysis_snapshot_id,
    status, version_number, version_label, created_by, published_at
  ) values (
    v_org_a, v_project_a, v_snapshot_a, v_snapshot_a,
    'PUBLISHED', 1, 'v1', v_user_a, now()
  )
  returning id into v_published_a;

  insert into public.toc_nodes (
    tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id, pos_x, pos_y
  ) values (
    v_org_a, v_published_a, 'GOAL', 'Goal A', v_user_a, null, 0, 0
  )
  returning id into v_goal_a;

  insert into public.toc_nodes (
    tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id, pos_x, pos_y
  ) values (
    v_org_a, v_published_a, 'OUTCOME', 'Outcome A', v_user_a, v_goal_a, 250, 100
  )
  returning id into v_outcome_a;

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org_a, v_published_a, v_goal_a, v_outcome_a, 'CONTRIBUTES_TO',
    'causal', 'Mechanism A', 'medium', 'none', v_user_a
  );

  -- Cross-tenant reads by user B must return zero rows.
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set role authenticated;

  select count(*) into v_count from public.toc_versions where tenant_id = v_org_a;
  if v_count <> 0 then
    reset role;
    raise exception 'S0 C1 FAIL: cross-tenant toc_versions read leaked % row(s)', v_count;
  end if;

  select count(*) into v_count from public.toc_nodes where tenant_id = v_org_a;
  if v_count <> 0 then
    reset role;
    raise exception 'S0 C1 FAIL: cross-tenant toc_nodes read leaked % row(s)', v_count;
  end if;

  select count(*) into v_count from public.toc_edges where tenant_id = v_org_a;
  if v_count <> 0 then
    reset role;
    raise exception 'S0 C1 FAIL: cross-tenant toc_edges read leaked % row(s)', v_count;
  end if;

  reset role;

  -- Published write attempts by user A must be no-op (0 affected rows).
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set role authenticated;

  update public.toc_versions
  set version_label = 'v999'
  where id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 C1 FAIL: published toc_versions update affected % row(s)', v_rows;
  end if;

  update public.toc_nodes
  set title = 'Should Not Update'
  where toc_version_id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 C1 FAIL: published toc_nodes update affected % row(s)', v_rows;
  end if;

  update public.toc_edges
  set mechanism = 'Should Not Update'
  where toc_version_id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 C1 FAIL: published toc_edges update affected % row(s)', v_rows;
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

select json_build_object('result', 'PASS', 'test', 's0_toc_draft_crud_scope') as proof;

rollback;
