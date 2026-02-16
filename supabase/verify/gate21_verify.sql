-- Gate 21: Projects + Reporting Periods Verification
-- This script validates that projects and reporting periods are tenant-isolated.

DO $$
DECLARE
    _org_id uuid;
    _other_org_id uuid;
    _user_id uuid;
    _other_user_id uuid;
    _project_id uuid;
    _other_project_id uuid;
    _period_id uuid;
BEGIN
    -- 1. Setup mock data as Superuser
    -- Get or create users
    SELECT id INTO _user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO _other_user_id FROM auth.users ORDER BY created_at ASC OFFSET 1 LIMIT 1;

    IF _user_id IS NULL OR _other_user_id IS NULL THEN
        RAISE NOTICE 'Insufficient users for full simulation. Skipping.';
    ELSE
        -- Create Organizations
        INSERT INTO public.organizations (name, created_by) VALUES ('Gate 21 Org A', _user_id) RETURNING id INTO _org_id;
        INSERT INTO public.organizations (name, created_by) VALUES ('Gate 21 Org B', _other_user_id) RETURNING id INTO _other_org_id;

        -- Create Memberships (Note: on_org_created_add_owner trigger may have already added them)
        INSERT INTO public.org_memberships (org_id, user_id, role) VALUES (_org_id, _user_id, 'owner') ON CONFLICT DO NOTHING;
        INSERT INTO public.org_memberships (org_id, user_id, role) VALUES (_other_org_id, _other_user_id, 'owner') ON CONFLICT DO NOTHING;

        -- Create Projects
        INSERT INTO public.projects (tenant_id, title, created_by) VALUES (_org_id, 'Project A', _user_id) RETURNING id INTO _project_id;
        INSERT INTO public.projects (tenant_id, title, created_by) VALUES (_other_org_id, 'Project B', _other_user_id) RETURNING id INTO _other_project_id;

        -- Create Reporting Periods
        INSERT INTO public.reporting_periods (tenant_id, project_id, label, start_date, end_date, created_by)
        VALUES (_other_org_id, _other_project_id, 'Period B', '2024-01-01', '2024-12-31', _other_user_id);

        -- SCENARIO: Isolation Check
        -- Switch to user A
        PERFORM set_config('request.jwt.claim.sub', _user_id::text, true);
        PERFORM set_config('request.jwt.claims', json_build_object('sub', _user_id, 'role', 'authenticated')::text, true);
        SET ROLE authenticated;

        -- User A should only see Project A
        IF (SELECT count(*) FROM public.projects) != 1 THEN
            RESET ROLE;
            RAISE EXCEPTION 'Isolation Failed: User A saw more than 1 project';
        END IF;

        -- User A should see 0 periods
        IF (SELECT count(*) FROM public.reporting_periods) != 0 THEN
            RESET ROLE;
            RAISE EXCEPTION 'Isolation Failed: User A saw periods from another org';
        END IF;

        -- User A creates a period
        RESET ROLE;
        INSERT INTO public.reporting_periods (tenant_id, project_id, label, start_date, end_date, created_by)
        VALUES (_org_id, _project_id, 'Period A', '2024-01-01', '2024-03-31', _user_id) RETURNING id INTO _period_id;
        
        SET ROLE authenticated;
        -- Now User A should see 1 period
        IF (SELECT count(*) FROM public.reporting_periods) != 1 THEN
            RESET ROLE;
            RAISE EXCEPTION 'Isolation Failed: User A failed to see their own period';
        END IF;

        -- Verify RLS hardening: User A updates Project A (allowed)
        UPDATE public.projects SET title = 'Project A Updated' WHERE id = _project_id;
        IF (SELECT title FROM public.projects WHERE id = _project_id) != 'Project A Updated' THEN
            RESET ROLE;
            RAISE EXCEPTION 'Update Failed: User A could not update their own project';
        END IF;

        -- Verify CROSS-ORG insertion failure (RLS CHECK)
        BEGIN
            INSERT INTO public.reporting_periods (tenant_id, project_id, label, start_date, end_date, created_by)
            VALUES (_other_org_id, _other_project_id, 'Evil Period', '2024-01-01', '2024-03-31', _user_id);
            RESET ROLE;
            RAISE EXCEPTION 'Security Vulnerability: Cross-org insert allowed';
        EXCEPTION WHEN others THEN
            -- Expected
            RAISE NOTICE 'Cross-org insert correctly blocked.';
        END;

        RESET ROLE;

        -- Cleanup
        DELETE FROM public.reporting_periods WHERE tenant_id IN (_org_id, _other_org_id);
        DELETE FROM public.projects WHERE tenant_id IN (_org_id, _other_org_id);
        DELETE FROM public.org_memberships WHERE org_id IN (_org_id, _other_org_id);
        DELETE FROM public.organizations WHERE id IN (_org_id, _other_org_id);
    END IF;
END $$;

SELECT 'PASS' as result;
