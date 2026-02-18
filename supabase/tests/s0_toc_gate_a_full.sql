-- S0 Gate A deterministic error-code matrix (best-effort for GA-01..GA-08)
-- Note: GA-05 is additionally enforced by unique index presence.

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
  v_output uuid;
  v_activity uuid;
  v_has_index int;
  v_gate jsonb;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values (v_user, 's0_ga_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('S0 GA Org', v_user) returning id into v_org;
  insert into public.projects (tenant_id, title, created_by) values (v_org, 'S0 GA Project', v_user) returning id into v_project;
  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by)
  values (v_org, v_project, 'S0 GA Snapshot', '{}'::jsonb, v_user) returning id into v_snapshot;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set role authenticated;

  -- GA-01: goal count must be exactly 1 (here: 0)
  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;
  begin
    perform public.publish_toc_version(v_org, v_project, v_draft);
    raise exception 'GA-01 FAIL: publish succeeded without goal';
  exception when others then
    if position('GA_ERR_GOAL_COUNT' in sqlerrm) = 0 then
      raise;
    end if;
  end;
  delete from public.toc_versions where id = v_draft;

  -- GA-02: orphan detection
  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values
    (v_org, v_draft, 'GOAL', 'Goal', v_user, null),
    (v_org, v_draft, 'OUTCOME', 'Orphan', v_user, null);
  begin
    perform public.publish_toc_version(v_org, v_project, v_draft);
    raise exception 'GA-02 FAIL: publish succeeded with orphan';
  exception when others then
    if position('GA_ERR_ORPHANS' in sqlerrm) = 0 then
      raise;
    end if;
  end;
  delete from public.toc_versions where id = v_draft;

  -- GA-03: type chain violation (OUTPUT directly under GOAL)
  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'GOAL', 'Goal', v_user, null) returning id into v_goal;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTPUT', 'Bad Output', v_user, v_goal) returning id into v_output;
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type, edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_goal, v_output, 'CONTRIBUTES_TO', 'causal', 'm', 'medium', 'none', v_user
  );
  begin
    perform public.publish_toc_version(v_org, v_project, v_draft);
    raise exception 'GA-03 FAIL: publish succeeded with bad type chain';
  exception when others then
    if position('GA_ERR_TYPE_CHAIN' in sqlerrm) = 0 then
      raise;
    end if;
  end;
  delete from public.toc_versions where id = v_draft;

  -- GA-04: causal cycle
  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'GOAL', 'Goal', v_user, null) returning id into v_goal;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTCOME', 'Outcome', v_user, v_goal) returning id into v_outcome;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTPUT', 'Output', v_user, v_outcome) returning id into v_output;
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type, edge_kind, mechanism, confidence, risk_flag, created_by
  ) values
    (v_org, v_draft, v_goal, v_outcome, 'CONTRIBUTES_TO', 'causal', 'm1', 'medium', 'none', v_user),
    (v_org, v_draft, v_outcome, v_output, 'CONTRIBUTES_TO', 'causal', 'm2', 'medium', 'none', v_user),
    (v_org, v_draft, v_output, v_goal, 'CONTRIBUTES_TO', 'causal', 'm3', 'medium', 'none', v_user);
  begin
    perform public.publish_toc_version(v_org, v_project, v_draft);
    raise exception 'GA-04 FAIL: publish succeeded with causal cycle';
  exception when others then
    if position('GA_ERR_CAUSAL_CYCLE' in sqlerrm) = 0 then
      raise;
    end if;
  end;
  delete from public.toc_versions where id = v_draft;

  -- GA-06: causal mechanism missing
  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'GOAL', 'Goal', v_user, null) returning id into v_goal;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTCOME', 'Outcome', v_user, v_goal) returning id into v_outcome;
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type, edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_goal, v_outcome, 'CONTRIBUTES_TO', 'causal', null, 'medium', 'none', v_user
  );
  begin
    perform public.publish_toc_version(v_org, v_project, v_draft);
    raise exception 'GA-06 FAIL: publish succeeded without mechanism';
  exception when others then
    if position('GA_ERR_EDGE_MECH' in sqlerrm) = 0 then
      raise;
    end if;
  end;
  delete from public.toc_versions where id = v_draft;

  -- GA-07: sentinel required when low confidence/high risk
  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'GOAL', 'Goal', v_user, null) returning id into v_goal;
  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values (v_org, v_draft, 'OUTCOME', 'Outcome', v_user, v_goal) returning id into v_outcome;
  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id, edge_type, edge_kind, mechanism, confidence, risk_flag, created_by
  ) values (
    v_org, v_draft, v_goal, v_outcome, 'CONTRIBUTES_TO', 'causal', 'm', 'low', 'none', v_user
  );
  begin
    perform public.publish_toc_version(v_org, v_project, v_draft);
    raise exception 'GA-07 FAIL: publish succeeded without sentinel';
  exception when others then
    if position('GA_ERR_SENTINEL' in sqlerrm) = 0 then
      raise;
    end if;
  end;
  delete from public.toc_versions where id = v_draft;

  -- GA-05: uniqueness enforcement check
  select count(*) into v_has_index
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'toc_edges'
    and indexname = 'toc_edges_unique_per_kind';
  if v_has_index <> 1 then
    raise exception 'GA-05 FAIL: required uniqueness index missing';
  end if;

  -- GA-08: RLS baseline positive check via validator
  v_gate := public.validate_gate_a(v_org, v_project, v_draft);
  if exists (
    select 1
    from jsonb_array_elements(coalesce(v_gate -> 'errors', '[]'::jsonb)) e
    where e ->> 'code' = 'GA_ERR_RLS_BASELINE'
  ) then
    raise exception 'GA-08 FAIL: RLS baseline reported as invalid unexpectedly';
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

select json_build_object('result', 'PASS', 'test', 's0_toc_gate_a_full') as proof;

rollback;
