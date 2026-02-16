-- Gate 6 Verification SQL (Proof-Grade)
-- Path: supabase/verify/gate6_verify.sql

SELECT '--- Phase 1: Column Presence ---' as msg;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'active_tenant_id';

SELECT '--- Phase 2: Foreign Key Definition ---' as msg;
SELECT
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_def
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
  AND conname = 'profiles_active_tenant_id_fkey';

SELECT '--- Phase 3: Index Consistency ---' as msg;
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles' 
  AND indexname = 'idx_profiles_active_tenant_id';

SELECT '--- Phase 4: Active Tenant Selection Policy ---' as msg;
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles' 
  AND policyname = 'profiles_update_own';

SELECT '--- Phase 5: RLS Status ---' as msg;
SELECT relname, relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND relname = 'profiles';

SELECT '--- Verification Complete ---' as msg;
