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
