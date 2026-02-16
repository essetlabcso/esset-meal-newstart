import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/storageState.json');

setup('authenticate', async ({ page }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Skipping auth setup: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
        setup.skip();
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const testEmail = 'e2e.test@essetmeal.local';
    const testPassword = 'Password123!';

    // 1. Ensure test user exists and is confirmed
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Failed to list users: ${listError.message}`);

    let user = users.find(u => u.email === testEmail);

    if (!user) {
        const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
        });
        if (createError) throw new Error(`Failed to create test user: ${createError.message}`);
        user = newUser!;
        console.log(`Created new test user: ${testEmail}`);
    } else {
        // Ensure it is confirmed
        await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
        console.log(`Reusing existing test user: ${testEmail}`);
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
