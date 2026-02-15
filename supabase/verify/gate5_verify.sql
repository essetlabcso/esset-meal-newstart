-- Gate 5 / 5.1 Verification Script (Proof-Grade)
-- Path: supabase/verify/gate5_verify.sql

\set ON_ERROR_STOP on

SELECT '--- Phase 1: Table Presence ---' as msg;
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
)
ORDER BY table_name;

SELECT '--- Phase 2: RLS Flags ---' as msg;
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
)
ORDER BY tablename;

SELECT '--- Phase 3: Policy Listing (with qual + with_check) ---' as msg;
SELECT tablename, policyname, cmd, qual, with_check
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
ORDER BY tablename, cmd, policyname;

SELECT '--- Phase 4: One-Draft-Per-Project Index ---' as msg;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'toc_versions' 
AND indexname = 'toc_versions_one_draft_per_project';

SELECT '--- Phase 5: Trigger Listing ---' as msg;
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table IN (
    'toc_nodes', 
    'toc_edges', 
    'toc_assumptions', 
    'toc_edge_assumptions'
)
ORDER BY event_object_table, trigger_name;

SELECT '--- Phase 6: RPC Existence ---' as msg;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('publish_toc_version', 'create_toc_draft')
ORDER BY routine_name;

SELECT '--- Verification Complete ---' as msg;
