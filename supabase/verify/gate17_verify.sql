-- Gate 17 Verification: RLS Recursion Fix & Onboarding Simulation
-- Renamed from gate16_verify.sql

-- 1) Verify presence of non-recursive policies
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM pg_policies WHERE tablename = 'org_memberships' AND policyname = 'orgm_select_if_member') = 1, 'Policy orgm_select_if_member missing';
    ASSERT (SELECT count(*) FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'org_select_if_member') = 1, 'Policy org_select_if_member missing';
END $$;

-- 2) Verify helper functions are SECURITY DEFINER and have safe search_path
DO $$
BEGIN
    ASSERT (SELECT prosecdef FROM pg_proc WHERE proname = 'is_tenant_member') = true, 'is_tenant_member should be SECURITY DEFINER';
    ASSERT (SELECT prosecdef FROM pg_proc WHERE proname = 'is_org_admin') = true, 'is_org_admin should be SECURITY DEFINER';
    
    ASSERT (SELECT proconfig::text FROM pg_proc WHERE proname = 'is_tenant_member') LIKE '%search_path=public%', 'is_tenant_member search_path should be public';
    ASSERT (SELECT proconfig::text FROM pg_proc WHERE proname = 'is_org_admin') LIKE '%search_path=public%', 'is_org_admin search_path should be public';
END $$;

-- 3) Proof-Grade Simulation: First Org Creation
-- This proves the recursion is gone by simulating the exact path of a new user.
BEGIN;
  -- Pick or create a user ID
  -- We'll use a deterministic UUID for the simulation
  SET LOCAL "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999999';
  SET LOCAL "request.jwt.claims" = '{"sub": "99999999-9999-9999-9999-999999999999", "role": "authenticated"}';
  SET LOCAL role authenticated;

  -- Attempt org creation
  INSERT INTO public.organizations (name) VALUES ('Gate 17 Simulation Org');

  -- Assertions
  ASSERT (SELECT count(*) FROM public.organizations WHERE name = 'Gate 17 Simulation Org') = 1, 'Org insert failed or was invisible';
  ASSERT (SELECT count(*) FROM public.org_memberships WHERE user_id = '99999999-9999-9999-9999-999999999999') = 1, 'Membership trigger failed';
  
  -- Confirm policy works for selection (triggers public.is_tenant_member)
  ASSERT (SELECT count(*) FROM public.org_memberships WHERE org_id = (SELECT id FROM public.organizations WHERE name = 'Gate 17 Simulation Org')) = 1, 'Select policy failed or recursive';

ROLLBACK;

SELECT 'PASS' as result;
