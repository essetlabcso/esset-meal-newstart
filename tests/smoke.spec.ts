import { test, expect } from '@playwright/test';

test.describe('ESSET MEAL Smoke Tests', () => {

    test('landing page loads and has core messaging', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('img[alt="ESSET MEAL Logo"]').first()).toBeVisible();
        await expect(page.getByText('MEAL that works for the field, not just the donor.')).toBeVisible();

        const signUpLink = page.getByRole('link', { name: 'Start a workspace', exact: true }).first();
        await expect(signUpLink).toBeVisible();
        await expect(signUpLink).toHaveAttribute('href', '/auth/sign-up');
    });

    test('demo page loads and shows steps', async ({ page }) => {
        await page.goto('/demo');
        await expect(page.getByText('Product Demo Flow')).toBeVisible();
        await expect(page.getByText('Step 1')).toBeVisible();
        await expect(page.getByText('Authentication')).toBeVisible();
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

});
