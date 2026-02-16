-- Gate 7 Verification SQL
-- Proves node layout columns, RLS status, and policy presence

SELECT '--- Phase 1: Column Presence ---' as msg;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'toc_nodes' 
  AND column_name IN ('pos_x', 'pos_y');

SELECT '--- Phase 2: ToC RLS Status ---' as msg;
SELECT relname, relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND relname IN ('toc_nodes', 'toc_edges', 'toc_versions', 'analysis_snapshots');

SELECT '--- Phase 3: Policy Listing (No FOR ALL) ---' as msg;
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('toc_nodes', 'toc_edges', 'toc_versions', 'analysis_snapshots')
ORDER BY tablename, cmd;

SELECT '--- Verification Complete ---' as msg;
