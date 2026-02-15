-- Gate 6.1: profiles.active_tenant_id RLS hardening
-- Ensure active_tenant_id can only be set to a tenant where the user has a membership.

-- 1) Find and DROP existing policy
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- 2) Recreate with constraint
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND (
    active_tenant_id IS NULL 
    OR public.is_tenant_member(active_tenant_id)
  )
);
