import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ESSET MEAL Authenticated Smoke Tests', () => {

    test('full critical path: workspace -> project -> snapshot -> toc -> publish', async ({ page }) => {
        const authFile = path.join(__dirname, '../playwright/.auth/storageState.json');
        if (!fs.existsSync(authFile)) {
            test.skip(true, 'Skipping authenticated tests: No storageState found.');
            return;
        }

        // 1. Redirect check
        await page.goto('/app/workspaces');

        // Onboarding if needed
        if (page.url().includes('/app/onboarding')) {
            await page.getByLabel(/organization name/i).fill('E2E Demo Org');
            await page.getByRole('button', { name: /create organization/i }).click();
            await expect(page).toHaveURL(/\/app\/workspaces/);
        }

        // 2. Select / Enter Workspace
        await expect(page.getByRole('link', { name: /enter workspace/i }).first()).toBeVisible();
        await page.getByRole('link', { name: /enter workspace/i }).first().click();
        await expect(page).toHaveURL(/\/app\/projects/);

        // 3. Create or Select Project
        const projectTitle = 'E2E Stability Project';
        const projectLink = page.getByRole('link', { name: projectTitle });

        if (!(await projectLink.isVisible())) {
            await page.getByPlaceholder(/Project Title/i).fill(projectTitle);
            await page.getByRole('button', { name: /Create Project/i }).click();
            await expect(projectLink).toBeVisible();
        }
        await projectLink.click();

        // 4. Analysis Snapshot
        await page.getByRole('link', { name: /Analysis/i }).click();
        const snapshotName = 'E2E Stable Snapshot';
        if (!(await page.getByText(snapshotName).isVisible())) {
            await page.getByRole('link', { name: /New Snapshot/i }).click();
            await page.getByLabel(/Snapshot Title/i).fill(snapshotName);
            await page.getByLabel(/Context Summary/i).fill('E2E Proof');
            await page.getByLabel(/Problem Statement/i).fill('E2E Challenge');
            await page.getByRole('button', { name: /Save Snapshot/i }).click();
            await expect(page.getByText(snapshotName)).toBeVisible();
        }

        // 5. ToC Draft
        await page.getByRole('link', { name: /ToC/i }).click();

        // If no draft exists, create one
        if (await page.getByRole('button', { name: /Create ToC Draft/i }).isVisible()) {
            await page.selectOption('select[name="snapshot_id"]', { label: snapshotName });
            await page.getByRole('button', { name: /Create ToC Draft/i }).click();
        }

        await expect(page.getByText('Theory of Change Builder')).toBeVisible();

        // 6. Node / Edge / Assumption
        const nodeTitle = 'E2E Goal Node';
        if (!(await page.getByText(nodeTitle).isVisible())) {
            await page.getByPlaceholder(/Node Title/i).fill(nodeTitle);
            await page.getByRole('button', { name: /Create Node/i }).click();
            await expect(page.getByText(nodeTitle)).toBeVisible();
        }

        // Add assumption
        const nodeCard = page.locator('div.bg-white\\/5').filter({ hasText: nodeTitle });
        await nodeCard.getByPlaceholder(/Add assumption/i).fill('E2E Assumption');
        await page.keyboard.press('Enter');
        await expect(nodeCard.getByText('E2E Assumption')).toBeVisible();

        // 7. Publish if still a draft
        const publishBtn = page.getByTestId('publish-button');
        if (await publishBtn.isVisible()) {
            await publishBtn.click();
            await expect(page.getByText('PUBLISHED')).toBeVisible();
        } else {
            await expect(page.getByText('PUBLISHED')).toBeVisible();
        }
    });
});
