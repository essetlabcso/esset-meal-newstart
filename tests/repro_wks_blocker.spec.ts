import { test, expect } from '@playwright/test';

test('reproduce workspace creation blocker', async ({ page }) => {
    const uniqueEmail = `repro-${Date.now()}@example.com`;
    const password = 'Password123!';

    // 1. Sign up
    await page.goto('/auth/sign-up');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up/i }).click();

    // 2. Wait for onboarding (or sign-in if needed)
    // Depending on auth flow, might land on sign-in or check email
    // Given the previous conversation, it likely goes to onboarding or sign-in-success
    await page.waitForTimeout(2000); // Wait for potential redirects

    if (page.url().includes('/auth/sign-in')) {
        await page.getByLabel(/email/i).fill(uniqueEmail);
        await page.getByLabel(/password/i).fill(password);
        await page.getByRole('button', { name: /sign in/i }).click();
    }

    // 3. Try to create workspace
    await expect(page).toHaveURL(/\/app\/onboarding/, { timeout: 10000 });
    await page.getByTestId('onboarding-orgname').fill('Repro Workspace');
    await page.getByTestId('onboarding-submit').click();

    // 4. Expect failure
    const errorDisplay = page.getByTestId('onboarding-error');
    await expect(errorDisplay).toBeVisible({ timeout: 10000 });
    const errorText = await errorDisplay.innerText();
    console.log('Captured UI Error:', errorText);
});
