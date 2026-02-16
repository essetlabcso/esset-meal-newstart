-- Gate 9 Verification: Analysis Snapshots

-- 1. Confirm columns exist in analysis_snapshots
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'analysis_snapshots' 
    AND column_name IN ('id', 'tenant_id', 'project_id', 'title', 'snapshot', 'created_by', 'created_at')
ORDER BY 
    ordinal_position;

-- 2. Confirm RLS is enabled on analysis_snapshots
SELECT 
    relname, 
    relrowsecurity 
FROM 
    pg_class 
WHERE 
    oid = 'public.analysis_snapshots'::regclass;

-- 3. List policies for analysis_snapshots
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check 
FROM 
    pg_policies 
WHERE 
    tablename = 'analysis_snapshots';
