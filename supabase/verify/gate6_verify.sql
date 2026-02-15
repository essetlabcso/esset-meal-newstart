-- Gate 6 Verification SQL
-- 1) Check column existence
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'active_tenant_id';

-- 2) Check FK constraint
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name, 
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profiles' 
  AND kcu.column_name = 'active_tenant_id';

-- 3) Check index existence
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles' AND indexname = 'idx_profiles_active_tenant_id';

-- 4) Verify Policy (Existence and definition)
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles_update_own';
