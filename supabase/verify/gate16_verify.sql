-- Gate 16 Verification: RLS Recursion Fix

-- 1) Verify presence of non-recursive policies
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM pg_policies WHERE tablename = 'org_memberships' AND policyname = 'orgm_select_if_member') = 1, 'Policy orgm_select_if_member missing';
    ASSERT (SELECT count(*) FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'org_select_if_member') = 1, 'Policy org_select_if_member missing';
END $$;

-- 2) Verify helper functions are SECURITY DEFINER
DO $$
BEGIN
    ASSERT (SELECT prosecdef FROM pg_proc WHERE proname = 'is_tenant_member') = true, 'is_tenant_member should be SECURITY DEFINER';
    ASSERT (SELECT prosecdef FROM pg_proc WHERE proname = 'is_org_admin') = true, 'is_org_admin should be SECURITY DEFINER';
END $$;

-- 3) Sanity check: Simulation of org creation
-- (This should not fail with infinite recursion)
BEGIN;
  -- Mock user
  SET LOCAL "request.jwt.claims" = '{"sub": "5909c3e9-5b8d-44e1-85ef-ce84030a12de", "role": "authenticated"}';
  SET LOCAL role authenticated;

  -- Create org
  INSERT INTO public.organizations (name) VALUES ('Verification Org');

  -- Check if membership was created by trigger
  ASSERT (SELECT count(*) FROM public.org_memberships WHERE user_id = '5909c3e9-5b8d-44e1-85ef-ce84030a12de') > 0, 'Membership not created';

  -- Check if we can select the org (triggers the select policy)
  ASSERT (SELECT name FROM public.organizations WHERE name = 'Verification Org') = 'Verification Org', 'Could not select created organization';

ROLLBACK;

SELECT 'PASS' as result;
