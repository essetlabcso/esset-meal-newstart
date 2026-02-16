-- Gate 14: Workspace Members + Invitations
-- Migration: 20260216140000_gate14_org_invites.sql

-- 1) org_invitations table
create table if not exists public.org_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check(role in ('owner','admin','member')),
  token_hash text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz null,
  accepted_by uuid null references auth.users(id)
);

-- Indexes
create index if not exists idx_org_invitations_tenant_id on public.org_invitations(tenant_id);
create unique index if not exists idx_org_invitations_unique_pending 
on public.org_invitations(tenant_id, lower(email)) 
where accepted_at is null;

-- Enable RLS
alter table public.org_invitations enable row level security;

-- 2) RLS Policies
-- SELECT: admin/owner of tenant can view invites for that tenant
create policy "org_inv_select_admin"
on public.org_invitations for select
to authenticated
using (public.is_org_admin(tenant_id));

-- INSERT: admin/owner only
create policy "org_inv_insert_admin"
on public.org_invitations for insert
to authenticated
with check (public.is_org_admin(tenant_id));

-- DELETE: admin/owner only
create policy "org_inv_delete_admin"
on public.org_invitations for delete
to authenticated
using (public.is_org_admin(tenant_id));

-- 3) RPC: create_org_invite
create or replace function public.create_org_invite(
  p_tenant_id uuid,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raw_token text;
  v_token_hash text;
  v_invite_id uuid;
begin
  -- 1. Check if caller is admin/owner
  if not public.is_org_admin(p_tenant_id) then
    raise exception 'Unauthorized';
  end if;

  -- 2. Generate random raw token
  v_raw_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');

  -- 3. Insert invite
  insert into public.org_invitations (tenant_id, email, role, token_hash)
  values (p_tenant_id, p_email, p_role, v_token_hash)
  returning id into v_invite_id;

  -- 4. Return result
  return jsonb_build_object(
    'invite_id', v_invite_id,
    'raw_token', v_raw_token
  );
end;
$$;

-- 4) RPC: accept_org_invite
create or replace function public.accept_org_invite(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_hash text;
  v_invite record;
  v_user_email text;
begin
  -- 1. Ensure authenticated
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  -- 2. Calculate hash
  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  -- 3. Find invite
  select * into v_invite
  from public.org_invitations
  where token_hash = v_token_hash
    and accepted_at is null
    and expires_at > now();

  if not found then
    raise exception 'Invite not found or expired';
  end if;

  -- 4. Check email match (if jwt email available)
  v_user_email := auth.jwt() ->> 'email';
  if v_user_email is not null and lower(v_user_email) != lower(v_invite.email) then
    raise exception 'Email mismatch';
  end if;

  -- 5. Idempotent insert into org_memberships
  insert into public.org_memberships (org_id, user_id, role)
  values (v_invite.tenant_id, auth.uid(), v_invite.role)
  on conflict (org_id, user_id) do update
  set role = EXCLUDED.role; -- Update role if already member? Or keep existing? 
  -- Instruction says: acceptance adds org_membership safely (no duplicates).
  -- I'll use do nothing if already exists, or update if we want to change role.
  -- Given it's an invite, updating role seems reasonable.

  -- 6. Mark accepted
  update public.org_invitations
  set accepted_at = now(),
      accepted_by = auth.uid()
  where id = v_invite.id;

  -- 7. Return info
  return jsonb_build_object(
    'tenant_id', v_invite.tenant_id,
    'role', v_invite.role,
    'status', 'success'
  );
end;
$$;
