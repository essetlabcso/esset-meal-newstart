import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Skipping auth setup: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
        setup.skip();
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // 1. Create a confirmed user via Admin API
    const { error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
    });

    if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
    }

    // 2. Perform UI login to capture session
    await page.goto('/auth/sign-in');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to app
    await expect(page).toHaveURL(/\/app/);

    // 3. Save storage state
    await page.context().storageState({ path: authFile });
});
