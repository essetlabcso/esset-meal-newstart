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

### 2. Workspace & Project Creation
- **Action**: Onboarding: Create a "Demo Organization".
- **Expected**: Redirect to `/app/workspaces`.
- **Action**: Enter organization.
- **Action**: Create a new project: "Food Security Analysis 2026".
- **Expected**: Project card appears.

### 3. Analysis Snapshot
- **Action**: Click the project -> "Analysis" tab.
- **Action**: Click "New Snapshot".
- **Action**: Fill out the situational analysis (Problem, Stakeholders).
- **Action**: Click "Save Snapshot".
- **Expected**: Snapshot appears in the list.

### 4. Theory of Change (ToC) Builder
- **Action**: Click "ToC" tab.
- **Action**: In the "New Draft" section, select the snapshot and click "New Draft".
- **Expected**: Visual Graph Builder appears with an empty or cloned canvas.

### 5. Node & Edge Management
- **Action**: Use the "Add Node" sidebar to create a GOAL node.
- **Action**: Drag handles in the graph to connect an OUTCOME to the GOAL.
- **Action**: Click the GOAL node card below.
- **Action**: In "Outgoing Connectors", add an Edge Assumption (e.g., "Stable Market", Risk: Medium).
- **Expected**: Both node and edge assumptions appear in the list. Edge label `A:n` updates on the graph.

### 6. Workspace Member Invitations
- **Action**: Click "Workspaces" in the sidebar, then "Members".
- **Action**: Enter a colleague's email and select "Admin" or "Member".
- **Action**: Click "Generate Invite Link".
- **Expected**: A copyable link appears.
- **Action**: Log out and navigate to the generated link.
- **Expected**: Redirect to Sign In (with redirect back to invite).
- **Action**: Sign in as the invited user.
- **Expected**: "Invitation Accepted!" screen appears. Click "Go to Workspace".
- **Action**: Verify the user now has access to the workspace in `/app/workspaces`.

### 7. Publishing
- **Action**: Click "Publish" button in the header.
- **Expected**: Version status changes to PUBLISHED. UI (add/delete/drag) becomes read-only.

## Troubleshooting
- **404 Not Found**: Ensure you are logged in and have an active tenant. Use `/app/workspaces` to reset context.
- **Read-Only Mode**: Check if you are a "Member" (must be owner/admin to edit) or if the version is "Published".
- **Graph Not Saving**: Ensure the version ID in the URL matches a `DRAFT` version and you have owner/admin permissions.
