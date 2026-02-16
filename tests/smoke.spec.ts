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

    test('auth pages are premium and branded', async ({ page }) => {
        // Sign-in page
        await page.goto('/auth/sign-in');
        await expect(page.getByTestId('auth-logo')).toBeVisible();
        await expect(page.getByTestId('auth-signin-title')).toContainText(/Welcome back/i);
        await expect(page.getByTestId('auth-signin-submit')).toBeVisible();
        await expect(page.locator('footer')).toContainText(/Built for impact/i);

        // Sign-up page
        await page.goto('/auth/sign-up');
        await expect(page.getByTestId('auth-logo')).toBeVisible();
        await expect(page.getByTestId('auth-signup-title')).toContainText(/Create your account/i);
        await expect(page.getByTestId('auth-signup-submit')).toBeVisible();

        // Sign-up success (Check email)
        await page.goto('/auth/sign-up-success');
        await expect(page.getByTestId('auth-check-email-title')).toContainText(/Check your email/i);
        await expect(page.getByTestId('auth-check-email-cta')).toBeVisible();
    });

    test('app route redirects to sign-in when unauthenticated', async ({ page }) => {
        await page.goto('/app');
        await expect(page).toHaveURL(/\/auth\/sign-in/);
    });

});
