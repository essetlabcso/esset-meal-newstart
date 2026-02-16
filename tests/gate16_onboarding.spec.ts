import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Onboarding Regression (Gate 16)', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    test('new user can create organization without RLS recursion', async ({ page }) => {
        if (!supabaseUrl || !supabaseServiceKey) {
            test.skip(true, 'Skipping onboarding test: SUPABASE_SERVICE_ROLE_KEY missing.');
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const uniqueId = Math.random().toString(36).substring(7);
        const testEmail = `onboarding.${uniqueId}@essetmeal.local`;
        const testPassword = 'Password123!';

        // 1. Create fresh user
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
        });
        if (createError) throw new Error(`Failed to create test user: ${createError.message}`);

        try {
            // 2. Sign in via UI
            await page.goto('/auth/sign-in');
            await page.getByLabel(/email/i).fill(testEmail);
            await page.getByLabel(/password/i).fill(testPassword);
            await page.getByRole('button', { name: /sign in/i }).click();

            // 3. Expect onboarding page
            await expect(page).toHaveURL(/\/app\/onboarding/);
            await expect(page.getByText(/Create your organization/i)).toBeVisible();

            // 4. Fill organization name
            const orgName = `Regression Org ${uniqueId}`;
            await page.getByLabel(/Organization name/i).fill(orgName);
            await page.getByRole('button', { name: /Create organization/i }).click();

            // 5. Expect success redirect (to /app or /app/projects depending on app logic)
            // Based on AppLayout: if 1 membership exists, getActiveTenant auto-sets it and redirects to /app/workspaces -> /app/projects
            // or just stays on the intended page.
            await expect(page).not.toHaveURL(/\/app\/onboarding/);

            // Should eventually land in the app shell
            await expect(page.getByText(orgName)).toBeVisible();

        } finally {
            // Cleanup
            await supabase.auth.admin.deleteUser(user!.id);
        }
    });
});
