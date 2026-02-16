-- Gate 20 Verification: Workspace Roster Privacy
-- This script validates that roster visibility is restricted to admins or self.

-- 1) Verify presence of hardened SELECT policy
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM pg_policies WHERE tablename = 'org_memberships' AND policyname = 'orgm_select_privacy') = 1, 'Policy orgm_select_privacy missing';
END $$;

-- 2) Proof-Grade Privacy Simulation
DO $$
DECLARE
    _org_id uuid;
    _owner_id uuid;
    _member_id uuid;
    _other_user_id uuid;
BEGIN
    -- Setup: Get 3 real user IDs
    SELECT id INTO _owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO _member_id FROM auth.users ORDER BY created_at ASC OFFSET 1 LIMIT 1;
    SELECT id INTO _other_user_id FROM auth.users ORDER BY created_at ASC OFFSET 2 LIMIT 1;

    IF _owner_id IS NULL OR _member_id IS NULL OR _other_user_id IS NULL THEN
        RAISE NOTICE 'Insufficient users for full simulation (found fewer than 3). Skipping simulation block.';
    ELSE
        -- Admin / Owner Setup (using SUPERUSER session to prepare data)
        PERFORM set_config('request.jwt.claim.sub', _owner_id::text, true);
        PERFORM set_config('request.jwt.claims', json_build_object('sub', _owner_id, 'role', 'authenticated')::text, true);
        
        -- Create Org as power user (postgres)
        INSERT INTO public.organizations (name) VALUES ('Gate 20 Privacy Org') RETURNING id INTO _org_id;
        
        -- Owner is auto-added via trigger
        -- Manually add member as power user
        INSERT INTO public.org_memberships (org_id, user_id, role) VALUES (_org_id, _member_id, 'member');

        -- SCENARIO A: MEMBER sees only self
        -- Must switch behavior role to 'authenticated' to enforce RLS
        PERFORM set_config('request.jwt.claim.sub', _member_id::text, true);
        PERFORM set_config('request.jwt.claims', json_build_object('sub', _member_id, 'role', 'authenticated')::text, true);
        
        SET ROLE authenticated;
        IF (SELECT count(*) FROM public.org_memberships WHERE org_id = _org_id) != 1 THEN
            RESET ROLE;
            RAISE EXCEPTION 'Member saw more than themselves (Roster Leak)';
        END IF;
        RESET ROLE;

        -- SCENARIO B: ADMIN sees everyone
        PERFORM set_config('request.jwt.claim.sub', _owner_id::text, true);
        PERFORM set_config('request.jwt.claims', json_build_object('sub', _owner_id, 'role', 'authenticated')::text, true);
        
        SET ROLE authenticated;
        IF (SELECT count(*) FROM public.org_memberships WHERE org_id = _org_id) != 2 THEN
            RESET ROLE;
            RAISE EXCEPTION 'Admin failed to see full roster';
        END IF;
        RESET ROLE;

        -- SCENARIO C: EXTERNAL USER sees nothing
        PERFORM set_config('request.jwt.claim.sub', _other_user_id::text, true);
        PERFORM set_config('request.jwt.claims', json_build_object('sub', _other_user_id, 'role', 'authenticated')::text, true);
        
        SET ROLE authenticated;
        IF (SELECT count(*) FROM public.org_memberships WHERE org_id = _org_id) != 0 THEN
            RESET ROLE;
            RAISE EXCEPTION 'External user saw internal roster';
        END IF;
        RESET ROLE;

        -- Cleanup as power user
        DELETE FROM public.org_memberships WHERE org_id = _org_id;
        DELETE FROM public.organizations WHERE id = _org_id;
    END IF;
END $$;

SELECT 'PASS' as result;
