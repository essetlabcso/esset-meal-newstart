-- Migration: Atomic Workspace Creation RPC
-- Description: Creates a SECURITY DEFINER function to handle workspace creation and owner membership in a single transaction.

CREATE OR REPLACE FUNCTION public.create_workspace(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
BEGIN
  -- 1. Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate name
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Workspace name is required';
  END IF;

  -- 3. Insert into organizations
  INSERT INTO public.organizations (name, created_by)
  VALUES (trim(p_name), v_user_id)
  RETURNING id INTO v_org_id;

  -- 4. Insert into org_memberships (owner)
  -- Note: The existing trigger 'on_org_created_add_owner' might also fire.
  -- We use ON CONFLICT DO NOTHING to handle it gracefully if it does.
  INSERT INTO public.org_memberships (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner')
  ON CONFLICT (org_id, user_id) DO NOTHING;

  -- 5. Return the new org id
  RETURN v_org_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.create_workspace(text) IS 'Atomically creates an organization and assigns the creator as owner, bypassing RLS bootstrap issues.';
