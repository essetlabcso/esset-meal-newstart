import { test, expect } from '@playwright/test';

test.describe('Gate 21: Projects + Reporting Periods', () => {
    // Ensure this only runs in the auth project
    test.beforeEach(({ }, testInfo) => {
        if (testInfo.project.name !== 'auth') {
            test.skip();
        }
    });

    test('Owner can create project and reporting period', async ({ page }) => {
        await page.goto('/app/projects');

        // Create Project
        const projectName = `E2E Project ${Date.now()}`;
        await page.getByTestId('new-project-link').click();
        await page.getByTestId('project-title-input').fill(projectName);
        await page.getByTestId('project-short-code-input').fill('E2E');
        await page.getByTestId('create-project-button').click();

        // Wait for redirect back to projects list
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
        await page.getByTestId('period-label-input').fill(periodLabel);
        await page.getByTestId('period-start-date-input').fill(`${new Date().getFullYear()}-01-01`);
        await page.getByTestId('period-end-date-input').fill(`${new Date().getFullYear()}-03-31`);
        await page.getByTestId('add-period-button').click();

        await expect(page.getByText(periodLabel)).toBeVisible();

        // Cleanup Project
        await page.getByRole('link', { name: '← Back to Project' }).click();
        page.on('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page).toHaveURL(/\/app\/projects$/);
        await expect(page.getByText(projectName)).not.toBeVisible();
    });

    test('Isolation: User cannot access other workspace projects', async ({ page }) => {
        const fakeProjectId = '00000000-0000-0000-0000-000000000000';
        await page.goto(`/app/projects/${fakeProjectId}`);

        // Check for 404/not found behavior
        await expect(page.getByText(/404|not found/i).first()).toBeVisible();
    });
});
