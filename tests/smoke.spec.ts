import { test, expect } from '@playwright/test';

test.describe('ESSET MEAL Smoke Tests', () => {

    test('landing page loads and has core messaging', async ({ page }) => {
        await page.goto('/');

        // SEO/Metadata checks
        await expect(page).toHaveTitle(/ESSET MEAL/i);
        await expect(page).toHaveTitle(/MEAL.*field/i);

        const metaDescription = page.locator('meta[name="description"]');
        await expect(metaDescription).toHaveAttribute('content', /spreadsheet|CSO|decision/i);

        // Accessibility checks
        const skipLink = page.locator('a[href="#main-content"]');
        await expect(skipLink).toBeAttached(); // present in DOM

        // Tab through to focus skip link
        await page.keyboard.press('Tab');
        await expect(skipLink).toBeFocused();

        // Logo check - Case insensitive alt match
        await expect(page.locator('img[alt*="ESSET MEAL"]').first()).toBeVisible();

        // Assert hero messaging
        await expect(page.getByTestId('hero-headline')).toContainText(/MEAL.*field/i);

        // Assert CTAs
        const primaryCTA = page.getByTestId('hero-cta-primary');
        await expect(primaryCTA).toBeVisible();
        await expect(primaryCTA).toHaveAttribute('href', '/auth/sign-up');

        const secondaryCTA = page.getByTestId('hero-cta-secondary');
        await expect(secondaryCTA).toBeVisible();
        await expect(secondaryCTA).toHaveAttribute('href', '/demo');
    });

    test('demo page loads and shows steps with proper metadata', async ({ page }) => {
        await page.goto('/demo');
        await expect(page).toHaveTitle(/Product Demo/i);
        await expect(page.getByText('Product Demo Flow')).toBeVisible();
        await expect(page.getByText('Step 1')).toBeVisible();
        await expect(page.getByText('Authentication')).toBeVisible();

        const skipLink = page.locator('a[href="#main-content"]');
        await expect(skipLink).toBeAttached();
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
