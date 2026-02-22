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
  v_outcome_b uuid;
  v_output_shared uuid;
  v_primary_rows int;
  v_ghost_rows int;
  v_bad_ghost_rows int;
  v_distinct_node_count int;
  v_order_run_1 text[];
  v_order_run_2 text[];
  v_row_title text;
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
  values (v_org, v_draft, 'OUTCOME', 'Outcome B', v_user, v_goal) returning id into v_outcome_b;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTPUT', 'Shared Output', v_user, v_outcome_a) returning id into v_output_shared;

  -- Secondary link: same output projected under Outcome B as ghost row
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type,
    edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_outcome_b, v_output_shared, 'REFERENCES',
    'secondary_link', null, 'medium', 'none', v_user
  );

  select count(*) into v_primary_rows
  from public.read_toc_projection_matrix(v_org, v_project, v_draft) p
  where p.row_kind = 'primary'
    and node_id = v_output_shared
    and p.source_edge_id is null;

  if v_primary_rows <> 1 then
    reset role;
    raise exception 'TOC-PROJ FAIL: expected one primary row for shared node';
  end if;

  select count(*) into v_ghost_rows
  from public.read_toc_projection_matrix(v_org, v_project, v_draft) p
  where p.row_kind = 'ghost_secondary'
    and node_id = v_output_shared
    and p.source_edge_id is not null;

  if v_ghost_rows <> 1 then
    reset role;
    raise exception 'TOC-PROJ FAIL: expected one ghost row for shared node';
  end if;

  select count(*) into v_bad_ghost_rows
  from public.read_toc_projection_matrix(v_org, v_project, v_draft) p
  left join public.toc_edges e on e.id = p.source_edge_id
  where p.row_kind = 'ghost_secondary'
    and coalesce(e.edge_kind, '') <> 'secondary_link';

  if v_bad_ghost_rows <> 0 then
    reset role;
    raise exception 'TOC-PROJ FAIL: ghost rows must map to secondary_link edges';
  end if;

  select count(distinct node_id) into v_distinct_node_count
  from public.read_toc_projection_matrix(v_org, v_project, v_draft);

  if v_distinct_node_count <> 4 then
    reset role;
    raise exception 'TOC-PROJ FAIL: projection duplicated node records';
  end if;

  select array_agg(
    p.path_sort_key
      || '|' || p.row_kind
      || '|' || p.node_id::text
      || '|' || coalesce(p.projection_parent_id::text, '')
      || '|' || coalesce(p.primary_parent_id::text, '')
    order by
      p.path_sort_key,
      p.row_kind,
      p.node_id,
      coalesce(p.projection_parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(p.primary_parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  into v_order_run_1
  from public.read_toc_projection_matrix(v_org, v_project, v_draft) p;

  select array_agg(
    p.path_sort_key
      || '|' || p.row_kind
      || '|' || p.node_id::text
      || '|' || coalesce(p.projection_parent_id::text, '')
      || '|' || coalesce(p.primary_parent_id::text, '')
    order by
      p.path_sort_key,
      p.row_kind,
      p.node_id,
      coalesce(p.projection_parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(p.primary_parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  into v_order_run_2
  from public.read_toc_projection_matrix(v_org, v_project, v_draft) p;

  if v_order_run_1 is distinct from v_order_run_2 then
    reset role;
    raise exception 'TOC-PROJ FAIL: deterministic ordering drift between projection runs';
  end if;

  update public.toc_nodes
  set title = 'Shared Output Edited'
  where id = v_output_shared;

  select count(distinct p.node_title)
  into v_primary_rows
  from public.read_toc_projection_matrix(v_org, v_project, v_draft) p
  where p.node_id = v_output_shared;

  if v_primary_rows <> 1 then
    reset role;
    raise exception 'TOC-PROJ FAIL: shared node title drifted across projection rows';
  end if;

  select max(p.node_title)
  into v_row_title
  from public.read_toc_projection_matrix(v_org, v_project, v_draft) p
  where p.node_id = v_output_shared;

  if v_row_title <> 'Shared Output Edited' then
    reset role;
    raise exception 'TOC-PROJ FAIL: node edit did not propagate to read-model rows';
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
