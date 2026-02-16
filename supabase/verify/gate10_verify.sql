-- Gate 10 Verification: Edge Assumptions RLS & UX
-- Purpose: Prove toc_edge_assumptions has strict RLS and no blanket policies.

BEGIN;

-- 1. Check if RLS is enabled
SELECT 
    relname as table_name, 
    relrowsecurity as rls_enabled 
FROM pg_class 
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
WHERE relname = 'toc_edge_assumptions' 
AND nspname = 'public';

-- 2. List all policies for toc_edge_assumptions
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'toc_edge_assumptions';

-- 3. Verify no "FOR ALL" policies (optional but good for security check)
SELECT COUNT(*) as blanket_policies_count
FROM pg_policies 
WHERE tablename = 'toc_edge_assumptions' 
AND cmd = 'ALL';

-- 4. Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'toc_edge_assumptions' 
AND column_name IN ('id', 'tenant_id', 'toc_version_id', 'edge_id', 'assumption_text', 'risk_level');

ROLLBACK;
