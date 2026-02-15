# Gate 2: Supabase Bootstrap — Walkthrough

## Summary

Gate 2 bootstrapped the Supabase project with a clean base schema (profiles, organizations, org_memberships), RLS-first policies, security-definer helpers, and auto-triggers.

## Environment

| Item | Value |
|---|---|
| Supabase CLI | `2.75.0` |
| Project Ref | `qowxtpnhpidhgaoflpsn` |
| Link command | `supabase link --project-ref qowxtpnhpidhgaoflpsn` |
| Migration file | `supabase/migrations/20260215015800_gate2_bootstrap.sql` |

## db push result

```
Applying migration 20260215015800_gate2_bootstrap.sql...
NOTICE (42710): extension "pgcrypto" already exists, skipping
(all DROP IF EXISTS notices — expected on clean DB)
Finished supabase db push.
```

## Verification Outputs

### Tables

| table_name |
|---|
| org_memberships |
| organizations |
| profiles |

### RLS Flags

| relname | relrowsecurity |
|---|---|
| org_memberships | true |
| organizations | true |
| profiles | true |

### Policies (11 total)

| tablename | policyname |
|---|---|
| org_memberships | orgm_delete_admin_only |
| org_memberships | orgm_insert_admin_only |
| org_memberships | orgm_select_if_member |
| org_memberships | orgm_update_admin_only |
| organizations | org_delete_admin_only |
| organizations | org_insert_authenticated |
| organizations | org_select_if_member |
| organizations | org_update_admin_only |
| profiles | profiles_insert_own |
| profiles | profiles_select_own |
| profiles | profiles_update_own |

### Triggers

| tgname | relname |
|---|---|
| trg_profiles_updated_at | profiles |
| on_auth_user_created | users (auth.users) |
| on_org_created_add_owner | organizations |

## Types Generation

`supabase gen types typescript --linked` → `src/lib/database.types.ts` (7235 bytes)

## Build Proof

- `npm run lint` → exit 0 (clean)
- `npm run build` → ✓ Compiled successfully (Next.js 16.1.6 Turbopack)
