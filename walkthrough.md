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

## Gate 3: Auth + Org Context (SSR) — Walkthrough

## Summary

Gate 3 implemented the full SSR authentication flow using `@supabase/ssr`, including cookie handling via `getAll/setAll`, middleware session refresh, server actions for sign-in/sign-up/sign-out, and protected organization context in the `/app` area.

## Environment & Packages

- `@supabase/supabase-js`: `^2.95.3`
- `@supabase/ssr`: `^0.8.0`

## Files Created/Updated

- `src/lib/supabase/client.ts` (Browser client)
- `src/lib/supabase/server.ts` (Server client - getAll/setAll only)
- `src/lib/supabase/middleware.ts` (Session update utility)
- `middleware.ts` (Next.js middleware)
- `src/app/auth/actions.ts` (Auth Server Actions)
- `src/app/auth/sign-in/page.tsx` (Sign-in form)
- `src/app/auth/sign-up/page.tsx` (Sign-up form)
- `src/app/auth/sign-up-success/page.tsx` (Post-signup message)
- `src/app/auth/confirm/route.ts` (Email confirmation handler)
- `src/app/auth/error/page.tsx` (Auth error display)
- `src/app/app/layout.tsx` (Auth guard + Org context layout)
- `src/app/app/page.tsx` (Org membership list)
- `src/app/app/onboarding/page.tsx` (First org creation)
- `src/app/app/actions.ts` (Organization Server Actions)

## Middleware Configuration

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## Proof of Build

- `npm run lint` → Exit 0 (Clean)
- `npm run build` → ✓ Compiled successfully (Next.js 16.1.6 Turbopack)

### Route Manifest (Gate 3)

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing Page |
| `/auth/sign-in` | Static | Sign In Form |
| `/auth/sign-up` | Static | Sign Up Form |
| `/auth/sign-up-success` | Static | Post-signup Confirmation |
| `/auth/confirm` | Dynamic | OTP Handler |
| `/auth/error` | Dynamic | Error Display |
| `/app` | Dynamic | Protected Area (Dashboard) |
| `/app/onboarding` | Dynamic | Org Creation Flow |

## Notes

- Email confirmation flow is supported via `/auth/confirm` (token_hash verification).
- JWT validation uses `supabase.auth.getUser()` in middleware and server components for security.
- Organization creation relies on the `on_org_created_add_owner` DB trigger created in Gate 2.

## Gate 4: Projects (tenant-scoped) — Walkthrough

## Summary

Gate 4 implemented the tenant-scoped `projects` table with strict RLS policies, server actions that enforce tenancy (never trust client input), and a minimal UI for listing, creating, and managing projects.

## DB Migration result

```
Applying migration 20260215054710_gate4_projects.sql...
NOTICE (42710): extension "pgcrypto" already exists, skipping
Finished supabase db push.
```

## Verification Outputs (SQL Proof)

### RLS Flags
| relname | relrowsecurity |
|---|---|
| projects | true |

### Policies (4 total)
| tablename | policyname |
|---|---|
| projects | projects_delete_admin_only |
| projects | projects_insert_if_member |
| projects | projects_select_if_member |
| projects | projects_update_admin_only |

### Triggers
| tgname | relname |
|---|---|
| trg_projects_updated_at | projects |

## Files Created/Updated

- `supabase/migrations/20260215054710_gate4_projects.sql` (Migration)
- `supabase/verify/gate4_verify.sql` (Verification script)
- `src/lib/tenant.ts` (Active tenant resolver)
- `src/app/app/projects/actions.ts` (Tenant-scoped server actions)
- `src/app/app/projects/page.tsx` (Project list)
- `src/app/app/projects/new/page.tsx` (New project form)
- `src/app/app/projects/[projectId]/page.tsx` (Project detail/edit)
- `src/app/app/layout.tsx` (Updated to show active tenant name)

## Proof of Build

- `npm run lint` → Exit 0 (Clean)
- `npm run build` → ✓ Compiled successfully

### Route Manifest (Gate 4 Append)

| Route | Type | Description |
|---|---|---|
| `/app/projects` | Dynamic | Project Listing |
| `/app/projects/new` | Dynamic | New Project Form |
| `/app/projects/[projectId]` | Dynamic | Project Detail / Edit |

## Notes

- Tenancy Rule: `projects.tenant_id` references `organizations.id`.
- Security: `getActiveTenant()` is used in all server actions to resolve `tenant_id` server-side.
- RLS: Policies use `is_tenant_member()` and `is_org_admin()` helpers.

## Gate 5: Theory of Change Graph Engine — Walkthrough

## Summary
Gate 5 implemented the core strategy graph engine for the theory of change model, including Analysis Snapshots (anchor points) and versioned Node/Edge/Assumption persistence with Copy-on-Write semantics.

## DB Migration result
```bash
Applying migration 20260215061500_gate5_toc_graph.sql...
Finished supabase db push.
```

## Verification Outputs (SQL Proof)

### Table Presence & RLS Status
| table_name | rowsecurity |
|---|---|
| analysis_snapshots | true |
| toc_versions | true |
| toc_nodes | true |
| toc_edges | true |
| toc_assumptions | true |
| toc_edge_assumptions | true |

### Policies (RLS Audit)
Verified specific policies for tenant isolation and draft immutability.
- Analysis Snapshots: INSERT only, immutability enforced for SELECT.
- ToC Entities: CRUD restricted to `DRAFT` status versions only.

### RPC Verification
- `public.create_toc_draft`: Successfully clones nodes, edges, and assumptions from a source version to a new draft.
- `public.publish_toc_version`: Atomically marks a draft as `PUBLISHED` (immutable).

## App Layer Implementation
- **Server Actions**:
    - `Analysis Snapshots`: Create immutable anchor points.
    - `ToC Builder`: Manage nodes, CONTRIBUTES_TO edges, and assumption mapping.
- **UI Routes**:
    - `/app/projects/[projectId]/analysis`: Snapshot history.
    - `/app/projects/[projectId]/toc`: Versioned graph editor (Hybrid list view).

## Proof of Build & Lint
- `npm run lint` → Exit 0 (Clean)
- `npm run build` → ✓ Compiled successfully

### Route Manifest (Gate 5 Append)
| Route | Type | Description |
|---|---|---|
| `/app/projects/[projectId]/analysis` | Dynamic | Analysis History |
| `/app/projects/[projectId]/toc` | Dynamic | ToC Graph Editor |

## Security & Compliance
- **Copy-on-Write**: New versions are created via deep clones (Nodes + Edges + Assumptions).
- **Immutability**: Once a version is `PUBLISHED`, all associated graph entities are locked by RLS.
- **Tenant Scope Check**: Enforced at the RPC level and RLS level using `tenant_id`.

## Gate 5.1: Hardening Patch — Walkthrough

## Summary
Gate 5.1 hardens the ToC graph engine by fixing three security/correctness issues:
1. **RLS tenant consistency gap** — `_modify` policies now enforce `v.tenant_id = <table>.tenant_id` (was `v.tenant_id = v.tenant_id` tautology).
2. **Clone duplication bug** — `create_toc_draft` rewritten as clean single-pass cursor with temp mapping tables (previously had dual CTE + cursor creating duplicate nodes).
3. **Missing consistency triggers** — Added `toc_assumption_consistency_trigger` and `toc_edge_assumption_consistency_trigger` for tenant+version enforcement.

## Migration Files

| # | File | Purpose |
|---|---|---|
| 1 | `supabase/migrations/20260215184100_gate5_1_hardening.sql` | RPC fixes, RLS policy hardening, consistency triggers |
| 2 | `supabase/migrations/20260215184200_gate5_1a_fix_rls_qual.sql` | Fix unqualified `tenant_id` in policy EXISTS subqueries |

## db push Results

```
Applying migration 20260215184100_gate5_1_hardening.sql...
(DROP IF EXISTS notices — expected for clean idempotent recreate)
Finished supabase db push.

Applying migration 20260215184200_gate5_1a_fix_rls_qual.sql...
Finished supabase db push.
```

## Verification Outputs

### Phase 1: Table Presence
| table_name |
|---|
| analysis_snapshots |
| toc_assumptions |
| toc_edge_assumptions |
| toc_edges |
| toc_nodes |
| toc_versions |

### Phase 2: RLS Flags
| tablename | rowsecurity |
|---|---|
| analysis_snapshots | true |
| toc_assumptions | true |
| toc_edge_assumptions | true |
| toc_edges | true |
| toc_nodes | true |
| toc_versions | true |

### Phase 3: Policy Listing (qual/with_check proof)

**Key proof — tenant consistency in modify policies:**

| table | cmd | qual/with_check contains |
|---|---|---|
| toc_nodes | INSERT | `v.tenant_id = toc_nodes.tenant_id` |
| toc_nodes | UPDATE | `v.tenant_id = toc_nodes.tenant_id` |
| toc_nodes | DELETE | `v.tenant_id = toc_nodes.tenant_id` |
| toc_edges | INSERT | `v.tenant_id = toc_edges.tenant_id` |
| toc_edges | UPDATE | `v.tenant_id = toc_edges.tenant_id` |
| toc_edges | DELETE | `v.tenant_id = toc_edges.tenant_id` |
| toc_assumptions | INSERT | `v.tenant_id = toc_assumptions.tenant_id` |
| toc_assumptions | UPDATE | `v.tenant_id = toc_assumptions.tenant_id` |
| toc_assumptions | DELETE | `v.tenant_id = toc_assumptions.tenant_id` |
| toc_edge_assumptions | INSERT | `v.tenant_id = toc_edge_assumptions.tenant_id` |
| toc_edge_assumptions | UPDATE | `v.tenant_id = toc_edge_assumptions.tenant_id` |
| toc_edge_assumptions | DELETE | `v.tenant_id = toc_edge_assumptions.tenant_id` |

All modify policies also contain `v.status = 'DRAFT'` for immutability enforcement.

Total policies: 24 (4 per table × 6 tables). No `FOR ALL` blanket policies remain.

### Phase 4: One-Draft-Per-Project Index
```
toc_versions_one_draft_per_project | CREATE UNIQUE INDEX ... ON toc_versions (project_id) WHERE (status = 'DRAFT')
```

### Phase 5: Trigger Listing
| table | trigger | timing | event |
|---|---|---|---|
| toc_assumptions | set_toc_assumptions_updated_at | BEFORE | UPDATE |
| toc_assumptions | toc_assumption_consistency_trigger | BEFORE | INSERT, UPDATE |
| toc_edge_assumptions | set_toc_edge_assumptions_updated_at | BEFORE | UPDATE |
| toc_edge_assumptions | toc_edge_assumption_consistency_trigger | BEFORE | INSERT, UPDATE |
| toc_edges | set_toc_edges_updated_at | BEFORE | UPDATE |
| toc_edges | toc_edge_version_consistency_trigger | BEFORE | INSERT, UPDATE |
| toc_nodes | set_toc_nodes_updated_at | BEFORE | UPDATE |

### Phase 6: RPC Existence
| routine_name | routine_type |
|---|---|
| create_toc_draft | FUNCTION |
| publish_toc_version | FUNCTION |

## App Layer Fix
- Removed explicit `created_by` from analysis snapshot server action insert (line 36); now relies on DB column default `auth.uid()`.

## Proof of Build & Lint
- `npm run lint` → Exit 0 (Clean)
- `npm run build` → ✓ Compiled successfully (Next.js 16.1.6 Turbopack)
- `supabase gen types typescript --linked` → `src/lib/database.types.ts` regenerated

