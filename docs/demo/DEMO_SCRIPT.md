# ESSET MEAL - Demo Script

This script provides a deterministic walkthrough of the ESSET MEAL application for demo purposes.

## Preconditions
- Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are present in `.env.local`.
- Database migrations are applied (`supabase db push`).
- (Optional) Seed data is loaded (`supabase/seed/demo_seed.sql`).

## Step-by-Step Walkthrough

### 1. Authentication
- **Action**: Navigate to `/auth/sign-up` and create an account.
- **Expected**: Redirect to Success page or Login.
- **Action**: Sign in at `/auth/sign-in`.
- **Expected**: Redirect to `/app/onboarding` (first time) or `/app/workspaces`.

### 2. Workspace & Project
- **Action**: Create a new Workspace (Tenant).
- **Expected**: Redirect to `/app` (Dashboard).
- **Action**: Navigate to **Projects** -> **New Project**. Create "Demo Project".
- **Expected**: Project appears in the list. Click to open.

### 3. Theory of Change (Visual Builder)
- **Action**: Navigate to the **Theory of Change** tab.
- **Action**: Select a snapshot (if seeded) or create a fresh ToC Draft.
- **Action**: Add a **GOAL** node (e.g., "Reduced Food Waste").
- **Action**: Add an **OUTCOME** node (e.g., "Community Composting Active").
- **Action**: Drag a connection from Outcome to Goal.
- **Expected**: A line appears connecting the nodes.

### 4. Assumptions
- **Action**: On the "Community Composting Active" node, add a **Node Assumption** (e.g., "Community is willing to participate").
- **Action**: In the "Outgoing Edges" list below the node, find the edge to "Reduced Food Waste".
- **Action**: Add an **Edge Assumption** (e.g., "Composting directly impacts local waste volume", Risk: High).
- **Expected**: Both assumptions appear in the UI.

### 5. Publishing
- **Action**: Click the **Publish** button in the header.
- **Expected**: Version status changes from `DRAFT` to `PUBLISHED`. Mutations (add/delete/drag) are now disabled.

### 6. Analysis Snapshot
- **Action**: Navigate to the **Analysis** tab.
- **Action**: Click **New Analysis Snapshot**.
- **Action**: Fill in the situational analysis form and save.
- **Expected**: Snapshot appears in the history. Clicking it shows the detail view.

## Troubleshooting
- **404 Not Found**: Ensure you are logged in and have an active tenant. Use `/app/workspaces` to reset context.
- **Read-Only Mode**: Check if you are a "Member" (must be owner/admin to edit) or if the version is "Published".
- **Graph Not Saving**: Ensure the version ID in the URL matches a `DRAFT` version.
