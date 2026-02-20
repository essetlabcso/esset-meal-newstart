-- S0 export determinism + snapshot binding proof (RPT-01/RPT-02, AN-01..03)

begin;

do $$
declare
  v_user uuid := gen_random_uuid();
  v_org uuid;
  v_project uuid;
  v_snapshot uuid;
  v_draft uuid;
  v_goal uuid;
  v_outcome_a uuid;
  v_outcome_b uuid;
  v_output_shared uuid;
  v_publish jsonb;
  v_published uuid;
  v_linked_snapshot uuid;
  v_export_1 jsonb;
  v_export_2 jsonb;
  v_hash_1 text;
  v_hash_2 text;
  v_csv_hash_1 text;
  v_csv_hash_2 text;
  v_config_hash_1 text;
  v_config_hash_2 text;
  v_csv_text_1 text;
  v_csv_text_2 text;
  v_manifest_count int;
  v_reject_msg text;
  v_mismatch_msg text;
  v_footnotes_1 text[];
  v_footnotes_2 text[];
  v_row_count int;
  v_schema_version text;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values (v_user, 's0_export_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('S0 Export Org', v_user) returning id into v_org;
  insert into public.projects (tenant_id, title, created_by) values (v_org, 'S0 Export Project', v_user) returning id into v_project;
  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by)
  values (v_org, v_project, 'S0 Export Snapshot', '{"k":"v"}'::jsonb, v_user) returning id into v_snapshot;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;

  -- Reject draft export
  begin
    perform public.export_matrix_csv(
      v_org,
      v_project,
      v_draft,
      v_snapshot,
      '2026-01-01T00:00:00Z'::timestamptz,
      '2026-03-31T23:59:59Z'::timestamptz,
      '{"allocation_mode":"contribution"}'::jsonb
    );
    reset role;
    raise exception 'RPT FAIL: draft export should be rejected';
  exception when others then
    v_reject_msg := sqlerrm;
    if position('published ToC version' in v_reject_msg) = 0 then
      reset role;
      raise exception 'RPT FAIL: unexpected draft rejection message: %', v_reject_msg;
    end if;
  end;

  -- Shared-node setup for deterministic AN-02/03 reconciliation footnote output
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'GOAL', 'Goal', v_user, null) returning id into v_goal;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTCOME', 'Outcome A', v_user, v_goal) returning id into v_outcome_a;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTCOME', 'Outcome B', v_user, v_goal) returning id into v_outcome_b;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTPUT', 'Shared Output', v_user, v_outcome_a) returning id into v_output_shared;

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_goal, v_outcome_a, 'CONTRIBUTES_TO',
    'causal', 'Goal contributes to A', 'medium', 'none', v_user
  );

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_goal, v_outcome_b, 'CONTRIBUTES_TO',
    'causal', 'Goal contributes to B', 'medium', 'none', v_user
  );

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_outcome_a, v_output_shared, 'CONTRIBUTES_TO',
    'causal', 'Outcome A contributes to output', 'medium', 'none', v_user
  );

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_outcome_b, v_output_shared, 'REFERENCES',
    'secondary_link', null, 'medium', 'none', v_user
  );

  select public.publish_toc_version(v_org, v_project, v_draft) into v_publish;
  v_published := (v_publish ->> 'published_version_id')::uuid;
  v_linked_snapshot := (v_publish ->> 'linked_analysis_snapshot_id')::uuid;

  if v_linked_snapshot is null then
    reset role;
    raise exception 'RPT FAIL: linked snapshot missing on published version';
  end if;

  -- Snapshot mismatch rejection
  begin
    perform public.export_matrix_csv(
      v_org,
      v_project,
      v_published,
      gen_random_uuid(),
      '2026-01-01T00:00:00Z'::timestamptz,
      '2026-03-31T23:59:59Z'::timestamptz,
      '{"allocation_mode":"contribution"}'::jsonb
    );
    reset role;
    raise exception 'RPT FAIL: snapshot mismatch export should be rejected';
  exception when others then
    v_mismatch_msg := sqlerrm;
    if position('Snapshot mismatch' in v_mismatch_msg) = 0 then
      reset role;
      raise exception 'RPT FAIL: unexpected snapshot mismatch message: %', v_mismatch_msg;
    end if;
  end;

  select public.export_matrix_csv(
    v_org,
    v_project,
    v_published,
    v_linked_snapshot,
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-03-31T23:59:59Z'::timestamptz,
    '{"allocation_mode":"contribution"}'::jsonb
  ) into v_export_1;

  select public.export_matrix_csv(
    v_org,
    v_project,
    v_published,
    v_linked_snapshot,
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-03-31T23:59:59Z'::timestamptz,
    '{"allocation_mode":"contribution"}'::jsonb
  ) into v_export_2;

  v_hash_1 := v_export_1 ->> 'hash';
  v_hash_2 := v_export_2 ->> 'hash';
  v_csv_hash_1 := v_export_1 ->> 'csv_hash';
  v_csv_hash_2 := v_export_2 ->> 'csv_hash';
  v_config_hash_1 := v_export_1 ->> 'config_hash';
  v_config_hash_2 := v_export_2 ->> 'config_hash';
  v_csv_text_1 := v_export_1 ->> 'csv_text';
  v_csv_text_2 := v_export_2 ->> 'csv_text';

  if v_hash_1 is null or v_hash_2 is null or v_hash_1 <> v_hash_2 then
    reset role;
    raise exception 'RPT FAIL: deterministic manifest hash mismatch';
  end if;

  if v_csv_hash_1 is null or v_csv_hash_2 is null or v_csv_hash_1 <> v_csv_hash_2 then
    reset role;
    raise exception 'RPT FAIL: deterministic csv_hash mismatch';
  end if;

  if v_config_hash_1 is null or v_config_hash_2 is null or v_config_hash_1 <> v_config_hash_2 then
    reset role;
    raise exception 'RPT FAIL: deterministic config_hash mismatch';
  end if;

  if convert_to(v_csv_text_1, 'UTF8') <> convert_to(v_csv_text_2, 'UTF8') then
    reset role;
    raise exception 'RPT FAIL: CSV bytes mismatch across identical exports';
  end if;

  if (v_export_1 ->> 'analysis_snapshot_id')::uuid <> v_linked_snapshot then
    reset role;
    raise exception 'RPT FAIL: export not bound to linked analysis snapshot';
  end if;

  select array_agg(line order by ordinality)
  into v_footnotes_1
  from unnest(string_to_array(v_csv_text_1, E'\n')) with ordinality as t(line, ordinality)
  where line like '%AN-02/AN-03%';

  select array_agg(line order by ordinality)
  into v_footnotes_2
  from unnest(string_to_array(v_csv_text_2, E'\n')) with ordinality as t(line, ordinality)
  where line like '%AN-02/AN-03%';

  if coalesce(array_length(v_footnotes_1, 1), 0) = 0 then
    reset role;
    raise exception 'AN-02/03 FAIL: no reconciliation footnotes found for shared nodes';
  end if;

  if v_footnotes_1 is distinct from v_footnotes_2 then
    reset role;
    raise exception 'AN-02/03 FAIL: reconciliation footnotes are not deterministic';
  end if;

  select count(*) into v_manifest_count
  from public.report_manifests
  where tenant_id = v_org
    and project_id = v_project
    and toc_version_id = v_published
    and analysis_snapshot_id = v_linked_snapshot
    and csv_hash = v_csv_hash_1
    and config_hash = v_config_hash_1
    and hash = v_hash_1;

  if v_manifest_count < 2 then
    reset role;
    raise exception 'RPT FAIL: report manifests missing deterministic hash fields';
  end if;

  select m.row_count, m.schema_version
  into v_row_count, v_schema_version
  from public.report_manifests m
  where m.tenant_id = v_org
    and m.project_id = v_project
    and m.toc_version_id = v_published
  order by m.created_at desc
  limit 1;

  if coalesce(v_row_count, 0) <= 0 then
    reset role;
    raise exception 'RPT FAIL: row_count metadata missing/invalid';
  end if;

  if coalesce(v_schema_version, '') = '' then
    reset role;
    raise exception 'RPT FAIL: schema_version metadata missing';
  end if;

  begin
    perform public.export_matrix_csv(
      v_org,
      v_project,
      v_published,
      v_linked_snapshot,
      '2026-01-01T00:00:00Z'::timestamptz,
      '2026-03-31T23:59:59Z'::timestamptz,
      '{"allocation_mode":"weighted"}'::jsonb
    );
    reset role;
    raise exception 'AN-01 FAIL: weighted allocation export was not rejected';
  exception when others then
    if position('AN-01 violation' in sqlerrm) = 0 then
      reset role;
      raise;
    end if;
  end;

  reset role;

  delete from public.toc_versions where project_id = v_project;
  delete from public.analysis_snapshots where project_id = v_project;
  delete from public.projects where id = v_project;
  delete from public.org_memberships where org_id = v_org;
  delete from public.organizations where id = v_org;
  delete from auth.users where id = v_user;
end
$$;

select json_build_object('result', 'PASS', 'test', 's0_export_manifest_hash') as proof;

rollback;
