-- S0 security stop-ship tests (SEC-TEST-01/02 + SEC-03/04 invisible wall)
-- Scope covered:
-- - Projects (read/write)
-- - ToC versions, nodes, edges (read/write)
-- - report_manifests (read/write)
-- - export_matrix_csv RPC (cross-tenant write/rejection)
-- - read_toc_projection_matrix RPC (cross-tenant read)

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
  v_linked_snapshot_a uuid;
  v_goal_a uuid;
  v_outcome_a uuid;
  v_output_a uuid;
  v_publish_a jsonb;
  v_published_a uuid;
  v_projection_rows int;
  v_rows int;
  v_err text;
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

  -- Create one published version in org A so there is data to leak.
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set role authenticated;
  select public.create_toc_draft(v_org_a, v_project_a, v_snapshot_a, null) into v_draft_a;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org_a, v_draft_a, 'GOAL', 'Goal', v_user_a, null) returning id into v_goal_a;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org_a, v_draft_a, 'OUTCOME', 'Outcome', v_user_a, v_goal_a) returning id into v_outcome_a;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org_a, v_draft_a, 'OUTPUT', 'Output', v_user_a, v_outcome_a) returning id into v_output_a;
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org_a, v_draft_a, v_goal_a, v_outcome_a, 'CONTRIBUTES_TO',
    'causal', 'Mechanism', 'medium', 'none', v_user_a
  );
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org_a, v_draft_a, v_outcome_a, v_output_a, 'REFERENCES',
    'secondary_link', null, 'medium', 'none', v_user_a
  );
  select public.publish_toc_version(v_org_a, v_project_a, v_draft_a) into v_publish_a;
  v_published_a := (v_publish_a ->> 'published_version_id')::uuid;
  v_linked_snapshot_a := (v_publish_a ->> 'linked_analysis_snapshot_id')::uuid;

  -- Seed one manifest so report_manifests read/write checks are meaningful.
  perform public.export_matrix_csv(
    v_org_a,
    v_project_a,
    v_published_a,
    v_linked_snapshot_a,
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-03-31T23:59:59Z'::timestamptz,
    '{"allocation_mode":"contribution"}'::jsonb
  );
  reset role;

  -- SEC-TEST-01: User B must not read Org A data (0 rows / no visibility).
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set role authenticated;

  select count(*) into v_count from public.projects where id = v_project_a;
  if v_count <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant projects read leaked rows';
  end if;

  select count(*) into v_count from public.toc_versions where id = v_published_a;
  if v_count <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_versions read leaked rows';
  end if;

  select count(*) into v_count
  from public.toc_nodes n
  where n.toc_version_id = v_published_a;
  if v_count <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_nodes read leaked rows';
  end if;

  select count(*) into v_count
  from public.toc_edges e
  where e.toc_version_id = v_published_a;
  if v_count <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_edges read leaked rows';
  end if;

  select count(*) into v_count from public.report_manifests where project_id = v_project_a;
  if v_count <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant report_manifests read leaked rows';
  end if;

  select count(*) into v_projection_rows
  from public.read_toc_projection_matrix(v_org_a, v_project_a, v_published_a);
  if v_projection_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant projection RPC leaked rows';
  end if;

  -- SEC-TEST-02: Cross-tenant writes must be rejected / no-op with no existence leak.
  update public.projects
  set title = 'tamper'
  where id = v_project_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant projects update affected rows';
  end if;

  delete from public.projects
  where id = v_project_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant projects delete affected rows';
  end if;

  update public.toc_versions
  set version_label = 'tamper'
  where id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_versions update affected rows';
  end if;

  delete from public.toc_versions
  where id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_versions delete affected rows';
  end if;

  update public.toc_nodes
  set title = 'tamper'
  where toc_version_id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_nodes update affected rows';
  end if;

  delete from public.toc_nodes
  where toc_version_id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_nodes delete affected rows';
  end if;

  update public.toc_edges
  set mechanism = 'tamper'
  where toc_version_id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_edges update affected rows';
  end if;

  delete from public.toc_edges
  where toc_version_id = v_published_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant toc_edges delete affected rows';
  end if;

  delete from public.report_manifests
  where project_id = v_project_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    reset role;
    raise exception 'SEC FAIL: cross-tenant report_manifests delete affected rows';
  end if;

  -- Cross-tenant direct insert must fail without leaking existence.
  begin
    insert into public.report_manifests (
      tenant_id, project_id, toc_version_id, analysis_snapshot_id,
      time_window, export_type, config_json, csv_hash, config_hash, hash,
      row_count, schema_version, generated_at, artifact_csv, created_by
    ) values (
      v_org_a, v_project_a, v_published_a, v_snapshot_a,
      '{}'::jsonb, 'matrix_csv', '{}'::jsonb, 'x', 'x', 'x',
      1, 'f1_matrix_csv_v1', now(), 'x', v_user_b
    );
    reset role;
    raise exception 'SEC FAIL: cross-tenant write unexpectedly succeeded';
  exception when others then
    v_err := coalesce(sqlerrm, '');
    if position(v_project_a::text in v_err) > 0
      or position(v_org_a::text in v_err) > 0
      or position(v_published_a::text in v_err) > 0 then
      reset role;
      raise exception 'SEC FAIL: cross-tenant write error leaked existence: %', v_err;
    end if;
  end;

  -- Cross-tenant export RPC must fail and not leak resource identifiers.
  begin
    perform public.export_matrix_csv(
      v_org_a,
      v_project_a,
      v_published_a,
      v_linked_snapshot_a,
      '2026-01-01T00:00:00Z'::timestamptz,
      '2026-03-31T23:59:59Z'::timestamptz,
      '{"allocation_mode":"contribution"}'::jsonb
    );
    reset role;
    raise exception 'SEC FAIL: cross-tenant export RPC unexpectedly succeeded';
  exception when others then
    v_err := coalesce(sqlerrm, '');
    if position(v_project_a::text in v_err) > 0
      or position(v_org_a::text in v_err) > 0
      or position(v_published_a::text in v_err) > 0 then
      reset role;
      raise exception 'SEC FAIL: export RPC error leaked existence: %', v_err;
    end if;
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
