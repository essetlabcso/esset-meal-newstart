import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Gate 20: Invite Flow E2E Proof', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    test.beforeEach(async () => {
        if (!supabaseUrl || !supabaseServiceKey) {
            console.warn('Skipping Invite Flow E2E: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
            test.skip();
        }
    });

    test('full invite lifecycle: owner invites, member accepts, access is verified', async ({ browser }) => {
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
        const suffix = Date.now();
        const ownerEmail = `owner.${suffix}@essetmeal.local`;
        const memberEmail = `member.${suffix}@essetmeal.local`;
        const password = 'Password123!';
        const workspaceName = `Invite Proof Workspace ${suffix}`;

        // 1. Setup: Create Owner and Member users via Admin API
        const [{ data: { user: owner } }, { data: { user: member } }] = await Promise.all([
            supabase.auth.admin.createUser({ email: ownerEmail, password, email_confirm: true }),
            supabase.auth.admin.createUser({ email: memberEmail, password, email_confirm: true })
        ]);

        try {
            // --- OWNER CONTEXT ---
            const ownerContext = await browser.newContext();
            const ownerPage = await ownerContext.newPage();

            // Owner: Sign In
            await ownerPage.goto('/auth/sign-in');
            await ownerPage.getByLabel(/email/i).fill(ownerEmail);
            await ownerPage.getByLabel(/password/i).fill(password);
            await ownerPage.getByTestId('auth-signin-submit').click();

            // Owner: Create Workspace
            await ownerPage.goto('/app/onboarding');
            await ownerPage.getByTestId('onboarding-orgname').fill(workspaceName);
            await ownerPage.getByTestId('onboarding-submit').click();
            await expect(ownerPage).toHaveURL(/.*\/app$/);

            // Owner: Create Invite for Member
            await ownerPage.goto('/app/workspaces/members');
            await ownerPage.getByLabel(/email/i).fill(memberEmail);
            await ownerPage.getByRole('button', { name: /send invitation/i }).click();

            // Wait for invite to appear and capture token from the UI (it returns the link in dev/tests usually)
            // In our implementation, createInvite returns the raw_token which might be shown in a toast or list.
            // Let's assume the UI shows the invite link or we can intercept the action result.
            // For this proof, we'll fetch the token directly from DB since we have service key.
            await supabase
                .from('org_invitations')
                .select('token_hash')
                .eq('email', memberEmail)
                .single();

            // Wait - we need the RAW token. Our create_org_invite RPC returns it.
            // Since we can't easily get the raw token back if it's discarded, 
            // the test should ideally "find" it in the UI if we displayed it.
            // Our MemberInviteForm should ideally show the link for the proof.

            // To be robust for this E2E, I'll update the RPC/Action to ensure it's "visible" or I'll use a known pattern.
            // Actually, I can just "mock" the acceptance if I have to, but better to prove the /auth/invite route.

            // Let's assume the UI shows "Invite link copied" or similar. 
            // In a real test, we'd grab it from the UI.
            // I will use the service role to find the invite and then use the acceptInvite server action or rpc if I can't get raw token.
            // BUT the requirement is to prove /auth/invite?token=...

            // I'll re-run the createInvite call inside the test context to get the raw token if I can't find it in UI.
            // Or better: I'll check what MemberInviteForm does.

            // For now, I'll grab the raw token by intercepting the network response or checking the UI.
            // If the UI is basic, I'll "cheat" by using the service role to simulate the acceptance logic if I must, 
            // but I'll try to find the link.

            const inviteLink = await ownerPage.getByTestId('copy-invite-link').getAttribute('data-invite-link');
            if (!inviteLink) throw new Error("Invite link not found in UI");

            // --- MEMBER CONTEXT ---
            const memberContext = await browser.newContext();
            const memberPage = await memberContext.newPage();

            // Member: Visit invite link while unauthenticated
            await memberPage.goto(inviteLink);

            // Assert redirect to sign-in with next param
            await expect(memberPage).toHaveURL(/\/auth\/sign-in\?next=/);

            // Member: Sign In
            await memberPage.getByLabel(/email/i).fill(memberEmail);
            await memberPage.getByLabel(/password/i).fill(password);
            await memberPage.getByTestId('auth-signin-submit').click();

            // Assert "Invitation Accepted" page
            await expect(memberPage.getByText(/Invitation Accepted/i)).toBeVisible();

            // Click to Dashboard
            await memberPage.getByRole('link', { name: /Go to Workspace Now/i }).click();

            // Assert success landing in /app + workspace name visible
            await expect(memberPage).toHaveURL(/.*\/app$/);
            await expect(memberPage.locator('header')).toContainText(workspaceName);

            // Role Boundary: Member cannot access /app/workspaces/members
            await memberPage.goto('/app/workspaces/members');
            await expect(memberPage).toHaveURL(/\/app$/); // Redirected to dashboard (AppLayout or Page guard)

            await memberContext.close();
            await ownerContext.close();

        } finally {
            // Cleanup users (RLS handles memberships)
            await supabase.auth.admin.deleteUser(owner!.id);
            await supabase.auth.admin.deleteUser(member!.id);
        }
    });
});
