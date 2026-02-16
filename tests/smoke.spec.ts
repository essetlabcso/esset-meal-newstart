import { test, expect } from '@playwright/test';

test.describe('ESSET MEAL Smoke Tests', () => {

    test('landing page loads and has brand logo', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('img[alt="ESSET MEAL Logo"]')).toBeVisible();
        await expect(page.getByText('ESSET MEAL — New Start')).toBeVisible();
    });

    test('auth pages are reachable', async ({ page }) => {
        await page.goto('/auth/sign-in');
        await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();

        await page.goto('/auth/sign-up');
        await expect(page.getByRole('heading', { name: /Sign up/i })).toBeVisible();
    });

    test('app route redirects to sign-in when unauthenticated', async ({ page }) => {
        await page.goto('/app');
        // It should redirect to sign-in or a similar gateway
        await expect(page).toHaveURL(/\/auth\/sign-in/);
    });

    // Note: Full end-to-end flow requires a valid session.
    // These are placeholders/templates for where those tests would go 
    // once a test user/session injection helper is added.

    test.skip('authenticated flow: create project and toc', async ({ page }) => {
        // 1. Sign in
        await page.goto('/auth/sign-in');
        // ... sign in logic ...

        // 2. Go to projects
        await page.goto('/app/projects');
        await expect(page.getByText(/Projects/i)).toBeVisible();

        // 3. Open ToC
        // ... navigate to toc ...
        // await expect(page.getByTestId('publish-button')).toBeVisible();
    });
});
