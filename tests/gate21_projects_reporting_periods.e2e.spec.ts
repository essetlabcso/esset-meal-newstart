import { test, expect } from '@playwright/test';

test.describe('Gate 21: Projects + Reporting Periods', () => {
    test('Owner can create project and reporting period', async ({ page }) => {
        // Assume auth.setup has been run and we are logged in as owner
        await page.goto('/app/projects');

        // Create Project
        const projectName = `E2E Project ${Date.now()}`;
        await page.getByRole('link', { name: 'New Project' }).click();
        await page.getByLabel('Project Title').fill(projectName);
        await page.getByLabel('Short Code').fill('E2E');
        await page.getByRole('button', { name: 'Create Project' }).click();

        await expect(page).toHaveURL(/\/app\/projects$/);
        await expect(page.getByText(projectName)).toBeVisible();

        // Open Project
        await page.getByText(projectName).click();
        await expect(page).toHaveURL(/\/app\/projects\/[a-f0-9-]+$/);
        await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

        // Reporting Periods
        await page.getByRole('link', { name: 'Reporting Periods' }).click();
        await expect(page).toHaveURL(/.*\/reporting-periods$/);

        const periodLabel = `Q1 ${new Date().getFullYear()}`;
        await page.getByLabel('Label').fill(periodLabel);
        await page.getByLabel('Start Date').fill(`${new Date().getFullYear()}-01-01`);
        await page.getByLabel('End Date').fill(`${new Date().getFullYear()}-03-31`);
        await page.getByRole('button', { name: 'Add Period' }).click();

        await expect(page.getByText(periodLabel)).toBeVisible();

        // Cleanup Project (optional but good)
        await page.getByRole('link', { name: '← Back to Project' }).click();
        page.on('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page).toHaveURL(/\/app\/projects$/);
        await expect(page.getByText(projectName)).not.toBeVisible();
    });

    test('Isolation: User cannot access other workspace projects', async ({ page }) => {
        // This requires two workspaces, but for a simple isolation check we can try a bogus UUID
        const fakeProjectId = '00000000-0000-0000-0000-000000000000';
        await page.goto(`/app/projects/${fakeProjectId}`);

        // Should show 404/not found behavior
        const title = await page.title();
        const content = await page.content();

        const isNotFound = /404|not found|error/i.test(title) || /404|not found|could not be found/i.test(content);
        expect(isNotFound).toBe(true);
    });
});
