-- ToC RLS invisible-wall proof (cross-tenant reads must return 0 rows)

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
  v_version_a uuid;
  v_version_b uuid;
  v_count int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values
    (v_user_a, 'toc_rls_a_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated'),
    (v_user_b, 'toc_rls_b_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('ToC RLS Org A', v_user_a) returning id into v_org_a;
  insert into public.organizations (name, created_by) values ('ToC RLS Org B', v_user_b) returning id into v_org_b;

  insert into public.projects (tenant_id, title, created_by) values (v_org_a, 'ToC RLS Project A', v_user_a) returning id into v_project_a;
  insert into public.projects (tenant_id, title, created_by) values (v_org_b, 'ToC RLS Project B', v_user_b) returning id into v_project_b;

  insert into public.analysis_snapshots (tenant_id, project_id, title, snapshot, created_by)
  values
    (v_org_a, v_project_a, 'Snap A', '{}'::jsonb, v_user_a),
    (v_org_b, v_project_b, 'Snap B', '{}'::jsonb, v_user_b)
  returning id into v_snapshot_a;

  select id into v_snapshot_b
  from public.analysis_snapshots
  where tenant_id = v_org_b
    and project_id = v_project_b
  order by created_at desc
  limit 1;

  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.create_toc_draft(v_org_a, v_project_a, v_snapshot_a, null) into v_version_a;

  reset role;

  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set role authenticated;

  select public.create_toc_draft(v_org_b, v_project_b, v_snapshot_b, null) into v_version_b;

  select count(*) into v_count from public.toc_versions where id = v_version_a;
  if v_count <> 0 then
    reset role;
    raise exception 'RLS FAIL: user B can see user A ToC version';
  end if;

  select count(*) into v_count from public.toc_nodes where tenant_id = v_org_a;
  if v_count <> 0 then
    reset role;
    raise exception 'RLS FAIL: user B can see user A ToC nodes';
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

select json_build_object('result', 'PASS', 'test', 'toc_rls_zero_rows') as proof;

rollback;
