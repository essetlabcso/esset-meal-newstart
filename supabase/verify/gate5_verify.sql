-- Gate 5 Verification Script
-- Path: supabase/verify/gate5_verify.sql

\set ON_ERROR_STOP on

SELECT '--- Phase 1: Tables ---' as msg;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'analysis_snapshots', 
    'toc_versions', 
    'toc_nodes', 
    'toc_edges', 
    'toc_assumptions', 
    'toc_edge_assumptions'
);

SELECT '--- Phase 2: RLS Status ---' as msg;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'analysis_snapshots', 
    'toc_versions', 
    'toc_nodes', 
    'toc_edges', 
    'toc_assumptions', 
    'toc_edge_assumptions'
);

SELECT '--- Phase 3: Policy Count & Names ---' as msg;
SELECT tablename, policyname, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'analysis_snapshots', 
    'toc_versions', 
    'toc_nodes', 
    'toc_edges', 
    'toc_assumptions', 
    'toc_edge_assumptions'
)
ORDER BY tablename, cmd;

SELECT '--- Phase 4: Constraints & Indexes ---' as msg;
-- Check for the one-draft-per-project index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'toc_versions' 
AND indexname = 'toc_versions_one_draft_per_project';

SELECT '--- Phase 5: Triggers ---' as msg;
SELECT event_object_table, trigger_name 
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table IN (
    'toc_nodes', 
    'toc_edges', 
    'toc_assumptions', 
    'toc_edge_assumptions'
)
ORDER BY event_object_table;

SELECT '--- Phase 6: RPC Existence ---' as msg;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('publish_toc_version', 'create_toc_draft');

SELECT '--- Verification Complete ---' as msg;
