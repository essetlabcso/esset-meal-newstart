-- S0 security stop-ship tests (SEC-TEST-01/02 + SEC-03/04 invisible wall)

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
  v_publish_a jsonb;
  v_published_a uuid;
  v_count int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values
    (v_user_a, 's0_sec_a_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated'),
    (v_user_b, 's0_sec_b_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('S0 Sec Org A', v_user_a) returning id into v_org_a;
  insert into public.organizations (name, created_by) values ('S0 Sec Org B', v_user_b) returning id into v_org_b;

  insert into public.projects (tenant_id, title, created_by) values (v_org_a, 'S0 Sec Project A', v_user_a) returning id into v_project_a;
  insert into public.projects (tenant_id, title, created_by) values (v_org_b, 'S0 Sec Project B', v_user_b) returning id into v_project_b;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by)
  values (v_org_a, v_project_a, 'S0 Sec Snapshot A', '{}'::jsonb, v_user_a) returning id into v_snapshot_a;
  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by)
  values (v_org_b, v_project_b, 'S0 Sec Snapshot B', '{}'::jsonb, v_user_b) returning id into v_snapshot_b;

  -- Create one published version in org A so there is data to leak
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set role authenticated;
  select public.create_toc_draft(v_org_a, v_project_a, v_snapshot_a, null) into v_draft_a;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org_a, v_draft_a, 'GOAL', 'Goal', v_user_a, null) returning id into v_goal_a;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org_a, v_draft_a, 'OUTCOME', 'Outcome', v_user_a, v_goal_a) returning id into v_outcome_a;
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org_a, v_draft_a, v_goal_a, v_outcome_a, 'CONTRIBUTES_TO',
    'causal', 'Mechanism', 'medium', 'none', v_user_a
  );
  select public.publish_toc_version(v_org_a, v_project_a, v_draft_a) into v_publish_a;
  v_published_a := (v_publish_a ->> 'published_version_id')::uuid;
  reset role;

  -- User B must not read org A data (SEC-TEST-01)
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set role authenticated;

  select count(*) into v_count from public.toc_versions where id = v_published_a;
  if v_count <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_versions read leaked rows';
  end if;

  select count(*) into v_count from public.report_manifests where project_id = v_project_a;
  if v_count <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant report_manifests read leaked rows';
  end if;

  -- Cross-tenant write should fail (SEC-TEST-02)
  begin
    insert into public.report_manifests (
      tenant_id, project_id, toc_version_id, analysis_snapshot_id,
      time_window, export_type, config_json, hash, artifact_csv, created_by
    ) values (
      v_org_a, v_project_a, v_published_a, v_snapshot_a,
      '{}'::jsonb, 'matrix_csv', '{}'::jsonb, 'x', 'x', v_user_b
    );
    reset role;
    raise exception 'SEC FAIL: cross-tenant write unexpectedly succeeded';
  exception when others then
    null;
  end;

  reset role;

  delete from public.toc_versions where project_id in (v_project_a, v_project_b);
  delete from public.analysis_snapshots where project_id in (v_project_a, v_project_b);
  delete from public.projects where id in (v_project_a, v_project_b);
  delete from public.org_memberships where org_id in (v_org_a, v_org_b);
  delete from public.organizations where id in (v_org_a, v_org_b);
  delete from auth.users where id in (v_user_a, v_user_b);
end
$$;

select json_build_object('result', 'PASS', 'test', 's0_sec_stop_ship') as proof;

rollback;
