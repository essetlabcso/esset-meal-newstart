-- Gate 20: Workspace Roster Privacy
-- Migration: 20260216181717_gate20_privacy.sql

-- 1) Drop the broad select policy
DROP POLICY IF EXISTS "orgm_select_if_member" ON public.org_memberships;

-- 2) Apply hardened SELECT policy
-- A user can see:
--  a) Their own membership row
--  b) All membership rows for an org where they are an admin/owner
CREATE POLICY "orgm_select_privacy"
ON public.org_memberships FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  public.is_org_admin(org_id)
);

-- Note: is_org_admin is SECURITY DEFINER and non-recursive (verified in Gate 17)

-- 3) Ensure org_invitations are also admin-only (already covered in Gate 14 migration, but we verify here)
-- Gate 14 added:
-- create policy "org_inv_select_admin" on public.org_invitations for select using (public.is_org_admin(tenant_id));
-- This is already correct.
