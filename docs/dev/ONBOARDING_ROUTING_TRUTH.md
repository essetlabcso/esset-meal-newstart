# ONBOARDING ROUTING TRUTH

This document locks the deterministic routing logic for user onboarding and workspace context in ESSET MEAL.

## The Gating Mechanism

The core gating logic resides in `src/app/app/layout.tsx`. It uses the `listUserTenants` and `getActiveTenant` utilities from `@/lib/tenant` to decide whether a user needs to create a workspace, select one, or proceed to the app.

### 1. The "No Memberships" State (Onboarding)
- **Condition**: `listUserTenants(supabase)` returns an empty array.
- **Behavior**: The layout allows the request to proceed to the current route (usually `/app/onboarding`).
- **Code Pointer**: `src/app/app/layout.tsx:30-32`
```typescript
if (tenants.length === 0) {
    return <>{children}</>;
}
```

### 2. The "Ambiguous Tenant" State (Workspace Selector)
- **Condition**: User has 2+ memberships but `getActiveTenant(supabase)` is `null`.
- **Behavior**: Redirect to `/app/workspaces`.
- **Code Pointer**: `src/app/app/layout.tsx:35-37`
```typescript
if (!tenant && tenants.length > 1) {
    redirect("/app/workspaces");
}
```

### 3. The "Single Membership" State (Auto-Resolution)
- **Condition**: User has exactly 1 membership.
- **Behavior**: `getActiveTenant` automatically persists this as the `active_tenant_id` in the `profiles` table and returns it.
- **Redirect**: The layout allows the request to `/app`.

### 4. The "Active Tenant" State (App Access)
- **Condition**: `tenant` is successfully resolved.
- **Behavior**: User is allowed access to the app shell with the active tenant context.

## Invite Flow Interaction

When a user accepts an invite:
1. The `accept_org_invite` trigger/function adds them to `org_memberships`.
2. Upon next visit to `/app`:
   - `listUserTenants` will return ≥ 1.
   - If it's their first and only membership, `getActiveTenant` auto-resolves it.
   - They are **not** sent to `/app/onboarding`, preserving the "seamless join" experience.

## Terminology Alignment
- **UI**: Always use "Workspace".
- **Database**: Tables are `organizations` and `org_memberships`. This mapping is stable.
