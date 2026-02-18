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
  v_outcome uuid;
  v_publish jsonb;
  v_published uuid;
  v_linked_snapshot uuid;
  v_export_1 jsonb;
  v_export_2 jsonb;
  v_hash_1 text;
  v_hash_2 text;
  v_manifest_count int;
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

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'GOAL', 'Goal', v_user, null) returning id into v_goal;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTCOME', 'Outcome', v_user, v_goal) returning id into v_outcome;
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_goal, v_outcome, 'CONTRIBUTES_TO',
    'causal', 'Mechanism', 'medium', 'none', v_user
  );

  select public.publish_toc_version(v_org, v_project, v_draft) into v_publish;
  v_published := (v_publish ->> 'published_version_id')::uuid;
  v_linked_snapshot := (v_publish ->> 'linked_analysis_snapshot_id')::uuid;

  if v_linked_snapshot is null then
    reset role;
    raise exception 'RPT FAIL: linked snapshot missing on published version';
  end if;

  select public.export_matrix_csv(
    v_org,
    v_project,
    v_published,
    '{"period":"2026Q1"}'::jsonb,
    '{"allocation_mode":"contribution"}'::jsonb
  ) into v_export_1;

  select public.export_matrix_csv(
    v_org,
    v_project,
    v_published,
    '{"period":"2026Q1"}'::jsonb,
    '{"allocation_mode":"contribution"}'::jsonb
  ) into v_export_2;

  v_hash_1 := v_export_1 ->> 'hash';
  v_hash_2 := v_export_2 ->> 'hash';

  if v_hash_1 is null or v_hash_2 is null or v_hash_1 <> v_hash_2 then
    reset role;
    raise exception 'RPT FAIL: deterministic hash mismatch';
  end if;

  if (v_export_1 ->> 'analysis_snapshot_id')::uuid <> v_linked_snapshot then
    reset role;
    raise exception 'RPT FAIL: export not bound to linked analysis snapshot';
  end if;

  select count(*) into v_manifest_count
  from public.report_manifests
  where tenant_id = v_org
    and project_id = v_project
    and toc_version_id = v_published
    and hash = v_hash_1;

  if v_manifest_count < 2 then
    reset role;
    raise exception 'RPT FAIL: report manifests missing for exports';
  end if;

  begin
    perform public.export_matrix_csv(
      v_org,
      v_project,
      v_published,
      '{"period":"2026Q1"}'::jsonb,
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
