import { test, expect } from '@playwright/test';

test('new user can create workspace end-to-end', async ({ page }) => {
    const testEmail = 'e2e.test@essetmeal.local';
    const password = 'Password123!';

    // 1. Sign in
    await page.goto('/auth/sign-in');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // 2. Handle redirect to onboarding or app
    await page.waitForTimeout(2000);
    console.log('Current URL after sign-in:', page.url());

    if (page.url().endsWith('/app')) {
        // If already has workspaces, we'll navigate to onboarding manually for the test
        // or just verify that the user is NOT blocked.
        // But the task is to fix the CREATION.
        await page.goto('/app/onboarding');
    }

    if (page.url().includes('/auth/sign-up-success')) {
        console.log('Email confirmation success page detected. Navigating to sign-in...');
        await page.goto('/auth/sign-in');
        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(password);
        await page.getByRole('button', { name: /sign in/i }).click();
    }

    await expect(page).toHaveURL(/\/(app\/onboarding|app)/, { timeout: 20000 });
    if (page.url().endsWith('/app')) {
        await page.goto('/app/onboarding');
    }

    // 3. Create workspace
    const workspaceName = `Green Impact ${Date.now()}`;
    await page.getByTestId('onboarding-orgname').fill(workspaceName);
    await page.getByTestId('onboarding-submit').click();

    // 4. Expect success: redirect to /app and see workspace name
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });

    // Check if the workspace name appears in the header (based on AppLayout)
    await expect(page.getByText(workspaceName)).toBeVisible();

    // 5. Verify the user is now on /app/projects (if that's the final landing)
    // AppLayout redirects from /app to /app/workspaces if ambiguous, but here it should be auto-set
    console.log('Workspace creation E2E PASSED');
});
