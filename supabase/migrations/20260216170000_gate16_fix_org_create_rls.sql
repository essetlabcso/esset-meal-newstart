-- Gate 16: Fix org creation RLS recursion
-- This migration replaces self-referencing subqueries in RLS policies with SECURITY DEFINER functions to break the recursion.

-- 1) Drop recursive policies
DROP POLICY IF EXISTS "orgm_select_if_member" ON public.org_memberships;
DROP POLICY IF EXISTS "org_select_if_member" ON public.organizations;

-- 2) Re-create policies using helper functions
-- Note: is_tenant_member and is_org_admin are already SECURITY DEFINER in previous migrations (Gate 4)
-- but we re-assert them here just in case or if any changes are needed.

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_memberships m
    WHERE m.org_id = _tenant_id
      AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_memberships m
    WHERE m.org_id = _org_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','admin')
  );
$$;

-- 3) Apply non-recursive policies
CREATE POLICY "orgm_select_if_member"
ON public.org_memberships FOR SELECT
TO authenticated
USING (public.is_tenant_member(org_id));

CREATE POLICY "org_select_if_member"
ON public.organizations FOR SELECT
TO authenticated
USING (public.is_tenant_member(id));

-- 4) Double check other policies for organizations and org_memberships to ensure they use functions
-- org_memberships: insert, update, delete
DROP POLICY IF EXISTS "orgm_insert_admin_only" ON public.org_memberships;
CREATE POLICY "orgm_insert_admin_only"
ON public.org_memberships FOR INSERT
TO authenticated
WITH CHECK (
  -- allow creator bootstrap (owner row) OR admins adding members
  ((user_id = auth.uid()) AND (role = 'owner'::text) AND (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = org_memberships.org_id) AND (o.created_by = auth.uid()))))) 
  OR public.is_org_admin(org_id)
);

DROP POLICY IF EXISTS "orgm_update_admin_only" ON public.org_memberships;
CREATE POLICY "orgm_update_admin_only"
ON public.org_memberships FOR UPDATE
TO authenticated
USING (public.is_org_admin(org_id))
WITH CHECK (public.is_org_admin(org_id));

DROP POLICY IF EXISTS "orgm_delete_admin_only" ON public.org_memberships;
CREATE POLICY "orgm_delete_admin_only"
ON public.org_memberships FOR DELETE
TO authenticated
USING (public.is_org_admin(org_id));

-- organizations: update, delete
DROP POLICY IF EXISTS "org_update_admin_only" ON public.organizations;
CREATE POLICY "org_update_admin_only"
ON public.organizations FOR UPDATE
TO authenticated
USING (public.is_org_admin(id))
WITH CHECK (public.is_org_admin(id));

DROP POLICY IF EXISTS "org_delete_admin_only" ON public.organizations;
CREATE POLICY "org_delete_admin_only"
ON public.organizations FOR DELETE
TO authenticated
USING (public.is_org_admin(id));
