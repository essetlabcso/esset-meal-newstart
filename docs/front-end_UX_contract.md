# ESSET MEAL Platform — Front-End UX Contract
**Canonical acceptance checklist for post–sign-in user experience (WKS + Main Home + Core Module Navigation)**  
**Status:** v1.0  
**Applies to:** `esset-meal-newstart` (all future front-end builds)  
**Scope:** What users see and can do **after sign-in**, before and across module builds.

---

## 0) Non-negotiable UX Principles

### 0.1 Determinism
- No “dead ends”, blank screens, or ambiguous states.
- Every page state has a **clear next step**.

### 0.2 Invisible Wall (Security UX)
- Unauthorized org/project/workspace access must behave like the resource **does not exist**:
  - Use **Not Found** (`notFound()`) rather than “Forbidden/403”.
  - Do not show messages that confirm existence (e.g., “You don’t have access to X workspace”).

### 0.3 Org + Project Scoping
- All authenticated experiences are scoped to:
  - **Workspace (org)**: `/app/:orgId/*`
  - **Project**: `/app/:orgId/projects/:projectId/*`
- Never send users to non-scoped “global” app pages after sign-in.

### 0.4 Polished UX Standard
- Loading → Empty → Success → Error states exist on every primary screen.
- Keyboard accessibility + focus rings are always visible.
- Contrast is readable (no white-on-white dropdown options).

---

## 1) Branding & Visual System Contract

### 1.1 ESSET Tokens (must be used consistently)
**Core colors**
- `--esset-teal-900: #04665D`
- `--esset-teal-800: #076A61`
- `--esset-cta: #F4A026`
- `--esset-cta-hover: #E7931D`
- `--esset-surface: #FFFFFF`
- `--esset-bg: #F2F7F7`
- `--esset-border: #E2E8F0`
- `--esset-ink: #0F172A`
- `--esset-muted: #475569`

**Focus ring**
- Light surfaces: `#94A3B8`
- Dark/teal shell: `rgba(255,255,255,0.35)`

### 1.2 Typography + layout
- H1: **32–40px mobile**, **40–48px desktop**, weight **800**
- H2: **24–28px**, weight **700**
- Body: 16px; Small: 14px  
- Max content width: **1120px**
- Card radius: **20–24px**
- Control radius: **12–14px**
- Shadows: **soft single-layer only**

### 1.3 Contrast hard rule (dropdowns)
Native `<select>` must not create unreadable option lists.  
If in a dark shell, use a “shell select” style with **light background + dark text**.

---

## 2) Post–Sign-In Core Flow Contract

### 2.1 Mandatory post-auth redirect
After successful sign-in/sign-up:
- MUST redirect to: **`/initialize`**

### 2.2 `/initialize` (Workspace gate) — deterministic state machine
`/initialize` must implement these states:

**A) Resolving**
- Spinner + text: “Checking your workspace access…”

**B) 0 workspaces**
- Show:
  - Create workspace (only if allowed)
  - Join via invite (always visible)

**C) 1 workspace**
- Auto-route to: `/app/:orgId/dashboard`

**D) >1 workspaces**
- If persisted active org is valid: route to it  
- Else show WorkspacePicker list

**E) Access revoked**
- Clear persisted org
- Show toast: “Your workspace access has changed.”

---

## 3) Setup & Workspace Management (WKS) Acceptance Checklist

### 3.1 Required routes
**Public**
- `/auth/sign-in`
- `/auth/sign-up` (if enabled)
- `/invites/accept?token=...`

**Onboarding**
- `/initialize`
- `/workspaces/new` (page or modal)

**Org-scoped management**
- `/app/:orgId/dashboard`
- `/app/:orgId/projects`
- `/app/:orgId/settings/members`
- `/app/:orgId/settings/branding`

### 3.2 Invite acceptance contract
- If token invalid/expired:
  - Show only: “This invite link isn’t valid. Ask your admin for a new one.”
  - Never show workspace/org name before validation success.
- If not authenticated:
  - Redirect to sign-in, then return to invite accept.

### 3.3 Workspace creation contract
- If backend does not support slug: **do not show slug UI**.
- Success must create owner membership.
- Invite-only mode:
  - If enabled, create workspace is hidden/disabled with copy:
    “Workspace creation is managed by your admin. Use an invite link.”

### 3.4 Members & invites contract
- Role dropdown must never crash; selected role persists before confirm.
- Pending invites must not show fake “Copy link”.
- Copy link appears only when a real link/token exists (e.g., immediate post-send banner).

### 3.5 Org-scoped shell minimum
On all `/app/:orgId/*` (non-project) pages:
- Workspace switcher visible
- User menu/sign out visible
- No double headers with project shell

**Security UX**
- Unauthorized org routes: `notFound()`

---

## 4) Main Home (Project Home) + Global Shell Contract

### 4.1 Project entry points
**Project list (picker)**
- `/app/:orgId/projects`

**Project Home**
- `/app/:orgId/projects/:projectId/home`

### 4.2 Active project persistence
- Active project should be remembered (cookie preferred; server-readable).
- Invalid/removed project ID is cleared silently and user is routed to projects list.
- No existence leak when a saved project becomes invalid.

### 4.3 Project-scoped shell (always present)
On all `/app/:orgId/projects/:projectId/*`:
- **TopContextBar** + **LeftNav** must render.

TopContextBar must include:
- Workspace switcher
- Project selector that works in **one action** (onChange navigates)
- Recovery link: **Projects** → `/app/:orgId/projects`
- User menu/sign out

**Security UX**
- Unauthorized project access: `notFound()`

---

## 5) Left Navigation Contract

### 5.1 Canonical menu labels (must use exactly)
Use these labels in the left navigation (action-oriented, neat):

1. **Define Context**
2. **Build ToC**
3. **Plan Indicators**
4. **Capture Data**
5. **Evidence Library**
6. **Learning**
7. **Accountability**
8. **Analytics & Reports**

### 5.2 Navigation behavior requirements
- Always highlights the current module.
- Collapsible on mobile.
- Must include recovery links:
  - Project Home
  - All projects
- Must not show links the user cannot access (avoid hinting).

---

## 6) Module Routing Contract (Root stubs only until built)
Until each module is implemented, the module root routes must exist as **stubs**:

- `/app/:orgId/projects/:projectId/define` (or `/analyze` if current code uses that; pick one canonical path and keep it)
- `/app/:orgId/projects/:projectId/toc` (or `/strategy`)
- `/app/:orgId/projects/:projectId/plan`
- `/app/:orgId/projects/:projectId/capture`
- `/app/:orgId/projects/:projectId/evidence`
- `/app/:orgId/projects/:projectId/learning`
- `/app/:orgId/projects/:projectId/accountability`
- `/app/:orgId/projects/:projectId/analytics`

> If the repo already uses different route names (e.g., `/analyze`, `/strategy`), the canonical menu labels must still be used, but the hrefs should map to the existing route structure consistently.

### Stub UI content (deterministic)
Each stub must show:
- Title: “Coming soon”
- Body: “This module is being prepared. You can continue from Project Home.”
- Buttons:
  - “Back to Project Home”
  - “Go to Projects”

Security:
- All stubs enforce project scope; unauthorized access → `notFound()`.

---

## 7) Project Home Dashboard Contract (minimum viable)
Project Home is an operational command center.

Minimum content blocks/cards:
- **Workflow Progress Map** (status per module: Ready/In progress/Blocked/Coming soon)
- **Reporting period status** (or “Set up reporting period” CTA)
- **Recent activity** (placeholder if no feed)
- **Data quality & safety** (placeholder if no metrics yet)
- **Quick actions** (4–6 next steps)

Each card must have:
- Loading
- Empty + next step CTA
- Error (plain language; non-leaky)
- Success view

---

## 8) Standard UX Requirements (applies everywhere)

### 8.1 Forms
- Disable submit while pending; show spinner.
- Inline validation errors; focus first invalid field.
- Confirm modals for destructive actions.

### 8.2 Accessibility
- Visible focus rings.
- Keyboard navigation for menus, dropdowns, dialogs.
- Accordions and menus have correct ARIA attributes.

### 8.3 Copy rules
- Plain language, English-as-second-language friendly.
- Never show “Forbidden” or “You don’t have permission”.
- Never leak existence of org/workspace/project via error messages.

---

## 9) Quality Gates (must pass before claiming “done”)

### 9.1 Automated
- `npm run lint` — PASS  
- `npm run build` — PASS  
- `npm test` — PASS (or minimal tests must be added for new critical helpers)

### 9.2 Manual verification (must be repeatable)
1) Sign in → `/initialize`  
2) Resolve workspace → `/app/:orgId/dashboard` (org top bar visible)  
3) Go to `/app/:orgId/projects` → open project → `/home`  
4) Switch project from top bar in one action → lands on new `/home`  
5) Visit unauthorized org/project routes → Not Found  
6) Invite accept invalid token → generic message only  
7) Contrast check: readable dropdown options + readable text everywhere

---

## 10) Change Control
Any future front-end work must:
- Maintain all items in this contract,
- Add module internals incrementally,
- Keep the left menu labels exactly as specified,
- Never weaken Invisible Wall behavior.

---