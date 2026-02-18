-- S0 projection contract proof (ARCH-05/06/07, TOC-PROJ-01..04, TOC-MP-01/02)

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
  v_output_shared uuid;
  v_primary_rows int;
  v_ghost_rows int;
  v_distinct_node_count int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values (v_user, 's0_proj_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('S0 Projection Org', v_user) returning id into v_org;
  insert into public.projects (tenant_id, title, created_by) values (v_org, 'S0 Projection Project', v_user) returning id into v_project;
  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by)
  values (v_org, v_project, 'S0 Projection Snapshot', '{}'::jsonb, v_user) returning id into v_snapshot;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'GOAL', 'Goal', v_user, null) returning id into v_goal;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTCOME', 'Outcome A', v_user, v_goal) returning id into v_outcome_a;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTPUT', 'Shared Output', v_user, v_outcome_a) returning id into v_output_shared;

  -- Secondary link: same output projected under goal as ghost row
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_goal, v_output_shared, 'REFERENCES',
    'secondary_link', null, 'medium', 'none', v_user
  );

  perform public.rebuild_toc_projections(v_org, v_project, v_draft);

  select count(*) into v_primary_rows
  from public.toc_projections
  where tenant_id = v_org
    and toc_version_id = v_draft
    and node_id = v_output_shared
    and is_ghost = false;

  if v_primary_rows <> 1 then
    reset role;
    raise exception 'TOC-PROJ FAIL: expected one primary row for shared node';
  end if;

  select count(*) into v_ghost_rows
  from public.toc_projections
  where tenant_id = v_org
    and toc_version_id = v_draft
    and node_id = v_output_shared
    and is_ghost = true;

  if v_ghost_rows <> 1 then
    reset role;
    raise exception 'TOC-PROJ FAIL: expected one ghost row for shared node';
  end if;

  select count(distinct node_id) into v_distinct_node_count
  from public.toc_projections
  where tenant_id = v_org
    and toc_version_id = v_draft;

  if v_distinct_node_count <> 3 then
    reset role;
    raise exception 'TOC-PROJ FAIL: projection duplicated node records';
  end if;

  reset role;

  delete from public.toc_versions where project_id = v_project;
  delete from public.analysis_snapshots where project_id = v_project;
  delete from public.projects where id = v_project;
  delete from public.org_memberships where org_id = v_org;
  delete from public.organizations where id = v_org;
  delete from auth.users where id = v_user;
end
$$;

select json_build_object('result', 'PASS', 'test', 's0_toc_projection_contract') as proof;

rollback;
