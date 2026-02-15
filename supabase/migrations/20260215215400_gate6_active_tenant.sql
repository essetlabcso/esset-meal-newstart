-- Gate 6: Active workspace persistence
-- Add active_tenant_id to profiles for deterministic tenant resolution.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_tenant_id uuid NULL
  REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_active_tenant_id
  ON public.profiles(active_tenant_id);
