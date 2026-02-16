import { test, expect } from '@playwright/test';

test.describe('ESSET MEAL Smoke Tests', () => {

    test('landing page loads and has core messaging', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('img[alt="ESSET MEAL Logo"]').first()).toBeVisible();

        // Assert hero messaging (resilient matching)
        await expect(page.getByTestId('hero-headline')).toContainText(/MEAL.*field/i);

        // Assert CTAs
        const primaryCTA = page.getByTestId('hero-cta-primary');
        await expect(primaryCTA).toBeVisible();
        await expect(primaryCTA).toHaveAttribute('href', '/auth/sign-up');

        const secondaryCTA = page.getByTestId('hero-cta-secondary');
        await expect(secondaryCTA).toBeVisible();
        await expect(secondaryCTA).toHaveAttribute('href', '/demo');
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
