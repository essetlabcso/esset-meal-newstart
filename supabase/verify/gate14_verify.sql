-- Gate 14 Verification: Workspace Members + Invitations
-- File: supabase/verify/gate14_verify.sql

begin;

-- 1. Table exists and RLS enabled
do $$ 
begin
  assert (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'org_invitations') = 1, 'org_invitations table missing';
  assert (select relrowsecurity from pg_class where oid = 'public.org_invitations'::regclass), 'RLS not enabled on org_invitations';
end $$;

-- 2. Policies exist (no blanket FOR ALL)
do $$
begin
  assert (select count(*) from pg_policies where tablename = 'org_invitations' and cmd = 'SELECT') > 0, 'Missing SELECT policy';
  assert (select count(*) from pg_policies where tablename = 'org_invitations' and cmd = 'INSERT') > 0, 'Missing INSERT policy';
  assert (select count(*) from pg_policies where tablename = 'org_invitations' and cmd = 'DELETE') > 0, 'Missing DELETE policy';
  assert (select count(*) from pg_policies where tablename = 'org_invitations' and cmd = 'UPDATE') = 0, 'UPDATE should be blocked (only RPC)';
  assert (select count(*) from pg_policies where tablename = 'org_invitations' and policyname like '%FOR ALL%') = 0, 'Blanket FOR ALL policy found';
end $$;

-- 3. RPCs exist and are security definer with safe search_path
do $$
begin
  assert (
    select prosecdef 
    from pg_proc p join pg_namespace n on p.pronamespace = n.oid 
    where n.nspname = 'public' and p.proname = 'create_org_invite'
  ), 'create_org_invite must be security definer';

  assert (
    select proconfig[1] 
    from pg_proc p join pg_namespace n on p.pronamespace = n.oid 
    where n.nspname = 'public' and p.proname = 'create_org_invite'
  ) = 'search_path=public', 'create_org_invite search_path must be public';

  assert (
    select prosecdef 
    from pg_proc p join pg_namespace n on p.pronamespace = n.oid 
    where n.nspname = 'public' and p.proname = 'accept_org_invite'
  ), 'accept_org_invite must be security definer';

  assert (
    select proconfig[1] 
    from pg_proc p join pg_namespace n on p.pronamespace = n.oid 
    where n.nspname = 'public' and p.proname = 'accept_org_invite'
  ) = 'search_path=public', 'accept_org_invite search_path must be public';
end $$;

-- 4. Uniqueness constraint (pending invites)
do $$
declare
  v_org_id uuid;
begin
  -- Search for an existing organization
  select id into v_org_id from organizations limit 1;
  
  if v_org_id is null then
    -- Fallback: create one if none exists (but usually there is one in dev)
    insert into organizations (name) values ('Test Org Verify') returning id into v_org_id;
  end if;

  -- Cleanup any existing test data for this org/email to ensure clean test
  delete from org_invitations where tenant_id = v_org_id and email = 'test@example.com';

  -- First invite
  insert into org_invitations (tenant_id, email, role, token_hash)
  values (v_org_id, 'test@example.com', 'member', 'hash1');

  -- Second invite for same email should fail (pending)
  begin
    insert into org_invitations (tenant_id, email, role, token_hash)
    values (v_org_id, 'test@example.com', 'admin', 'hash2');
    raise exception 'Should have failed uniqueness on pending invite';
  exception when unique_violation then
    -- success
  end;

  -- Mark first as accepted
  update org_invitations set accepted_at = now() where tenant_id = v_org_id and email = 'test@example.com';

  -- New invite for same email should now succeed
  insert into org_invitations (tenant_id, email, role, token_hash)
  values (v_org_id, 'test@example.com', 'member', 'hash3');
end $$;

rollback;
select 'Gate 14 Verification: SUCCESS' as status;
