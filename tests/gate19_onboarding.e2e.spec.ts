import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Gate 19: Onboarding E2E Proof', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    test.beforeEach(async () => {
        if (!supabaseUrl || !supabaseServiceKey) {
            console.warn('Skipping onboarding E2E: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
            test.skip();
        }
    });

    test('new user with zero memberships is routed to onboarding and can create workspace', async ({ page }) => {
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
        const uniqueId = Date.now();
        const testEmail = `onboarding.proof.${uniqueId}@essetmeal.local`;
        const testPassword = 'Password123!';

        // 1. Create a fresh user via Admin API
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
        });
        if (createError) throw createError;

        try {
            // 2. Sign in via UI
            await page.goto('/auth/sign-in');
            await page.getByLabel(/email/i).fill(testEmail);
            await page.getByLabel(/password/i).fill(testPassword);
            await page.getByTestId('auth-signin-submit').click();

            // 3. Assert redirect to onboarding (AppLayout logic)
            // Even if navigating to /app, it should redirect/show onboarding
            await page.goto('/app');
            await expect(page).toHaveURL(/\/app\/onboarding/);
            await expect(page.getByTestId('onboarding-title')).toContainText(/Create your workspace/i);

            // 4. Create Workspace
            const workspaceName = `Proof Workspace ${uniqueId}`;
            await page.getByTestId('onboarding-orgname').fill(workspaceName);
            await page.getByTestId('onboarding-submit').click();

            // 5. Assert success (Redirect to /app + workspace name visible)
            await expect(page).toHaveURL(/.*\/app$/);
            await expect(page.getByText(workspaceName)).toBeVisible();

            // Check app layout header
            await expect(page.locator('header')).toContainText(workspaceName);

        } finally {
            // Cleanup
            await supabase.auth.admin.deleteUser(user!.id);
        }
    });
});
