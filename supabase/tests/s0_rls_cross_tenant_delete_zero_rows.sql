-- S0 RLS delete safety proof: cross-tenant deletes must affect 0 rows.
-- Core tables covered: toc_versions, toc_nodes, toc_edges, analysis_snapshots, report_manifests.

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
  v_edge_a uuid;
  v_manifest_a uuid;
  v_rows int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values
    (v_user_a, 's0_del_a_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated'),
    (v_user_b, 's0_del_b_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('S0 Delete Org A', v_user_a) returning id into v_org_a;
  insert into public.organizations (name, created_by) values ('S0 Delete Org B', v_user_b) returning id into v_org_b;

  insert into public.projects (tenant_id, title, created_by) values (v_org_a, 'S0 Delete Project A', v_user_a) returning id into v_project_a;
  insert into public.projects (tenant_id, title, created_by) values (v_org_b, 'S0 Delete Project B', v_user_b) returning id into v_project_b;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, source, created_by)
  values (v_org_a, v_project_a, 'S0 Delete Snapshot A', '{}'::jsonb, 'ANL module', v_user_a)
  returning id into v_snapshot_a;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, source, created_by)
  values (v_org_b, v_project_b, 'S0 Delete Snapshot B', '{}'::jsonb, 'ANL module', v_user_b)
  returning id into v_snapshot_b;

  -- Build core ToC artifacts in tenant A as authenticated user A.
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.create_toc_draft(v_org_a, v_project_a, v_snapshot_a, null) into v_draft_a;

  insert into public.toc_nodes (
    tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id, pos_x, pos_y
  ) values (
    v_org_a, v_draft_a, 'GOAL', 'Delete Goal A', v_user_a, null, 0, 0
  )
  returning id into v_goal_a;

  insert into public.toc_nodes (
    tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id, pos_x, pos_y
  ) values (
    v_org_a, v_draft_a, 'OUTCOME', 'Delete Outcome A', v_user_a, v_goal_a, 200, 100
  )
  returning id into v_outcome_a;

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org_a, v_draft_a, v_goal_a, v_outcome_a, 'CONTRIBUTES_TO',
    'causal', 'Delete proof mechanism', 'medium', 'none', v_user_a
  )
  returning id into v_edge_a;

  insert into public.report_manifests (
    tenant_id, project_id, toc_version_id, analysis_snapshot_id,
    export_type, hash, artifact_csv
  ) values (
    v_org_a, v_project_a, v_draft_a, v_snapshot_a,
    'matrix_csv', 's0-delete-proof-hash', 'path_key,node_id'
  )
  returning id into v_manifest_a;

  reset role;

  -- User B (different tenant) tries to delete tenant A rows: all must be zero-row deletes.
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set role authenticated;

  delete from public.report_manifests
  where id = v_manifest_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 RLS DELETE FAIL: cross-tenant report_manifests delete affected % row(s)', v_rows;
  end if;

  delete from public.toc_edges
  where id = v_edge_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 RLS DELETE FAIL: cross-tenant toc_edges delete affected % row(s)', v_rows;
  end if;

  delete from public.toc_nodes
  where id in (v_goal_a, v_outcome_a);
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 RLS DELETE FAIL: cross-tenant toc_nodes delete affected % row(s)', v_rows;
  end if;

  delete from public.toc_versions
  where id = v_draft_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'S0 RLS DELETE FAIL: cross-tenant toc_versions delete affected % row(s)', v_rows;
  end if;

  delete from public.analysis_snapshots
  where id = v_snapshot_a;
  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    reset role;
    raise exception 'S0 RLS DELETE FAIL: cross-tenant delete affected % row(s)', v_rows;
  end if;

  reset role;

  delete from public.report_manifests where id = v_manifest_a;
  delete from public.toc_versions where id = v_draft_a;
  delete from public.analysis_snapshots where id in (v_snapshot_a, v_snapshot_b);
  delete from public.projects where id in (v_project_a, v_project_b);
  delete from public.org_memberships where org_id in (v_org_a, v_org_b);
  delete from public.organizations where id in (v_org_a, v_org_b);
  delete from auth.users where id in (v_user_a, v_user_b);
end
$$;

select json_build_object('result', 'PASS', 'test', 's0_rls_cross_tenant_delete_zero_rows') as proof;

rollback;
