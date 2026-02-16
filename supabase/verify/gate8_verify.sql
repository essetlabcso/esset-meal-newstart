-- Gate 8: ToC Graph Editor & Version Controls Verification
-- Focus: RLS Flags and Policy Verification (no schema changes)

-- 1. Check RLS flags for key ToC tables
SELECT
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND relname IN ('toc_nodes', 'toc_edges', 'toc_versions', 'toc_assumptions', 'toc_edge_assumptions');

-- 2. List all policies for these tables (no blanket FOR ALL expected)
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('toc_nodes', 'toc_edges', 'toc_versions', 'toc_assumptions', 'toc_edge_assumptions')
ORDER BY tablename, cmd;

-- 3. Verify no "FOR ALL" policies (defense in depth)
SELECT count(*) as forbidden_blanket_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('toc_nodes', 'toc_edges', 'toc_versions', 'toc_assumptions', 'toc_edge_assumptions')
  AND cmd = 'ALL';
