-- RLS regression proof for WKS + PRJ invisible walls.
-- Validates cross-org data reads return 0 rows under authenticated role.

begin;

do $$
declare
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_org_a uuid;
  v_org_b uuid;
  v_proj_a uuid;
  v_proj_b uuid;
  v_count int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
  values
    (v_user_a, 'rls_a_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated'),
    (v_user_b, 'rls_b_' || extract(epoch from now())::text || '@test.local', 'x', now(), 'authenticated');

  insert into public.organizations (name, created_by) values ('RLS Org A', v_user_a) returning id into v_org_a;
  insert into public.organizations (name, created_by) values ('RLS Org B', v_user_b) returning id into v_org_b;

  insert into public.projects (tenant_id, title, created_by)
  values (v_org_a, 'RLS Project A', v_user_a)
  returning id into v_proj_a;

  insert into public.projects (tenant_id, title, created_by)
  values (v_org_b, 'RLS Project B', v_user_b)
  returning id into v_proj_b;

  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set role authenticated;

  select count(*) into v_count from public.organizations where id = v_org_b;
  if v_count <> 0 then
    reset role;
    raise exception 'RLS FAIL: user A can see org B';
  end if;

  select count(*) into v_count from public.projects where id = v_proj_b;
  if v_count <> 0 then
    reset role;
    raise exception 'RLS FAIL: user A can see project B';
  end if;

  select count(*) into v_count from public.projects where tenant_id = v_org_a;
  if v_count <> 1 then
    reset role;
    raise exception 'RLS FAIL: user A cannot see own project';
  end if;

  reset role;

  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set role authenticated;

  select count(*) into v_count from public.projects where id = v_proj_a;
  if v_count <> 0 then
    reset role;
    raise exception 'RLS FAIL: user B can see project A';
  end if;

  reset role;

  delete from public.projects where tenant_id in (v_org_a, v_org_b);
  delete from public.org_memberships where org_id in (v_org_a, v_org_b);
  delete from public.organizations where id in (v_org_a, v_org_b);
  delete from auth.users where id in (v_user_a, v_user_b);
end
$$;

select json_build_object('result', 'PASS', 'test', 'rls_wks_prj') as proof;

rollback;
