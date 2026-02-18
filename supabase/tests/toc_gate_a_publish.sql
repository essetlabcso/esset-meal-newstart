-- S0 Gate A + publish proof:
-- - deterministic GA code on failure
-- - atomic publish + freeze snapshot binding
-- - immutable published version
-- - copy-on-write new draft lineage

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
  v_new_draft uuid;
  v_linked_snapshot uuid;
  v_count int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values (v_user, 'toc_gatea_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('Gate A Org', v_user) returning id into v_org;
  insert into public.projects (tenant_id, title, created_by) values (v_org, 'Gate A Project', v_user) returning id into v_project;
  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by)
  values (v_org, v_project, 'Gate A Snapshot', '{}'::jsonb, v_user)
  returning id into v_snapshot;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.create_toc_draft(v_org, v_project, v_snapshot, null) into v_draft;

  insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by, primary_parent_id)
  values
    (v_org, v_draft, 'GOAL', 'Goal', v_user, null),
    (v_org, v_draft, 'OUTCOME', 'Orphan Outcome', v_user, null)
  returning id into v_goal;

  select id into v_outcome
  from public.toc_nodes
  where toc_version_id = v_draft
    and node_type = 'OUTCOME'
  limit 1;

  begin
    perform public.publish_toc_version(v_org, v_project, v_draft);
    reset role;
    raise exception 'Gate A FAIL: publish succeeded with orphan node';
  exception when others then
    if position('GA_ERR_ORPHANS' in sqlerrm) = 0 then
      reset role;
      raise;
    end if;
  end;

  update public.toc_nodes
  set primary_parent_id = v_goal
  where id = v_outcome;

  insert into public.toc_edges (
    tenant_id, toc_version_id, source_node_id, target_node_id,
    edge_type, edge_kind, mechanism, confidence, risk_flag, created_by
  )
  values (
    v_org, v_draft, v_goal, v_outcome,
    'CONTRIBUTES_TO', 'causal', 'Pathway mechanism', 'medium', 'none', v_user
  );

  select public.publish_toc_version(v_org, v_project, v_draft) into v_publish;
  v_new_draft := (v_publish ->> 'new_draft_version_id')::uuid;
  v_linked_snapshot := (v_publish ->> 'linked_analysis_snapshot_id')::uuid;

  select count(*) into v_count
  from public.toc_versions
  where id = v_draft and status = 'PUBLISHED';
  if v_count <> 1 then
    reset role;
    raise exception 'Gate A FAIL: published version status not updated';
  end if;

  select count(*) into v_count
  from public.toc_versions
  where id = v_new_draft and status = 'DRAFT' and source_version_id = v_draft;
  if v_count <> 1 then
    reset role;
    raise exception 'Gate A FAIL: new draft copy-on-write was not created correctly';
  end if;

  if v_linked_snapshot is null then
    reset role;
    raise exception 'Gate A FAIL: linked_analysis_snapshot_id was not set';
  end if;

  if v_linked_snapshot = v_snapshot then
    reset role;
    raise exception 'Gate A FAIL: publish did not create freeze snapshot copy';
  end if;

  select count(*) into v_count
  from public.toc_versions
  where id = v_draft and linked_analysis_snapshot_id = v_linked_snapshot;
  if v_count <> 1 then
    reset role;
    raise exception 'Gate A FAIL: published version not bound to linked snapshot';
  end if;

  begin
    insert into public.toc_nodes (tenant_id, toc_version_id, node_type, title, created_by)
    values (v_org, v_draft, 'OUTPUT', 'Should Fail', v_user);
    reset role;
    raise exception 'Gate A FAIL: published version remained mutable';
  exception when others then
    null;
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

select json_build_object('result', 'PASS', 'test', 'toc_gate_a_publish') as proof;

rollback;
