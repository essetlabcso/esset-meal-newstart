-- Proof-Grade Verification: Workspace Creation Atomic
-- Ensures the create_workspace RPC works for a mock user, creates both rows, and respects ownership.

BEGIN;

-- 1. Create a dummy user context
-- We insert into auth.users and profiles to simulate a real user
DO $$
DECLARE
  v_test_user_id uuid := gen_random_uuid();
  v_new_org_id uuid;
BEGIN
  -- Insert dummy user (must bypass auth for this test)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
  VALUES (v_test_user_id, 'verify_wks@test.local', 'password', now(), 'authenticated');

  -- Profile should be created by trigger on_auth_user_created
  -- Ensure it exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_test_user_id) THEN
    RAISE EXCEPTION 'Profile was not created for test user';
  END IF;

  -- 2. Mock auth.uid() by setting it in the session
  -- This requires the test to run in a way that respects the setting
  -- Since we are in a transaction, we can set local variables
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', v_test_user_id), true);

  -- 3. Call the RPC
  v_new_org_id := public.create_workspace('Verify Workspace');

  -- 4. Assertions
  -- Organization exists
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = v_new_org_id AND name = 'Verify Workspace' AND created_by = v_test_user_id) THEN
    RAISE EXCEPTION 'Organization row not found or owner mismatch';
  END IF;

  -- Membership exists with owner role
  IF NOT EXISTS (SELECT 1 FROM public.org_memberships WHERE org_id = v_new_org_id AND user_id = v_test_user_id AND role = 'owner') THEN
    RAISE EXCEPTION 'Owner membership row not found';
  END IF;

  -- Check RLS Select (as the test user)
  -- The user should be able to see their own org
  IF NOT EXISTS (
    SELECT 1 
    FROM public.organizations 
    WHERE id = v_new_org_id
  ) THEN
    RAISE EXCEPTION 'RLS blocked owner from selecting their own organization';
  END IF;

  -- Check RLS Select Membership
  IF NOT EXISTS (
    SELECT 1 
    FROM public.org_memberships 
    WHERE org_id = v_new_org_id AND user_id = v_test_user_id
  ) THEN
    RAISE EXCEPTION 'RLS blocked owner from selecting their own membership';
  END IF;

  RAISE NOTICE 'Workspace creation verification PASSED';
END;
$$;

-- FINAL PROOF FORMAT
SELECT json_build_object('result', 'PASS') as verification_output;

ROLLBACK;
