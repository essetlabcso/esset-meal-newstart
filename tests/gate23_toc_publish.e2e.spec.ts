import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Gate 23: ToC Draft -> Gate A Publish -> Immutable Spine', () => {
    test.beforeEach(({ }, testInfo) => {
        if (testInfo.project.name !== 'auth') {
            test.skip();
        }
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            test.skip();
        }
    });

    test('publish is blocked for orphan, then succeeds and keeps published immutable', async ({ page }) => {
        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const stamp = Date.now();
        const orgName = `ToC Slice Org ${stamp}`;
        const projectName = `ToC Slice Project ${stamp}`;
        const snapshotTitle = `ToC Slice Snapshot ${stamp}`;

        const users = await admin.auth.admin.listUsers();
        if (users.error) throw new Error(users.error.message);

        const testUser = users.data.users.find((u) => u.email === 'e2e.test@essetmeal.local');
        if (!testUser) {
            test.skip();
            return;
        }

        let orgId = '';
        let projectId = '';
        let snapshotId = '';

        try {
            const org = await admin
                .from('organizations')
                .insert({ name: orgName, created_by: testUser.id })
                .select('id')
                .single();
            if (org.error || !org.data) throw new Error(org.error?.message || 'org create failed');
            orgId = org.data.id;

            const setActive = await admin
                .from('profiles')
                .update({ active_tenant_id: orgId })
                .eq('id', testUser.id);
            if (setActive.error) throw new Error(setActive.error.message);

            const project = await admin
                .from('projects')
                .insert({ tenant_id: orgId, title: projectName, created_by: testUser.id })
                .select('id')
                .single();
            if (project.error || !project.data) throw new Error(project.error?.message || 'project create failed');
            projectId = project.data.id;

            const snapshot = await admin
                .from('analysis_snapshots')
                .insert({ tenant_id: orgId, project_id: projectId, title: snapshotTitle, snapshot: {}, created_by: testUser.id })
                .select('id')
                .single();
            if (snapshot.error || !snapshot.data) throw new Error(snapshot.error?.message || 'snapshot create failed');
            snapshotId = snapshot.data.id;

            await page.goto(`/app/projects/${projectId}/toc`);
            await page.locator('select[name="snapshot_id"]').selectOption(snapshotId);
            await page.getByRole('button', { name: 'Create ToC Draft' }).click();

            await expect(page.getByTestId('publish-button')).toBeVisible();

            const typeSelect = page.locator('select[name="type"]').first();
            const titleInput = page.locator('input[name="title"]').first();
            const createNodeBtn = page.getByRole('button', { name: '+ Create Node' }).first();

            await typeSelect.selectOption('GOAL');
            await titleInput.fill('Goal Node');
            await createNodeBtn.click();

            await typeSelect.selectOption('OUTCOME');
            await titleInput.fill('Outcome Node');
            await createNodeBtn.click();

            await typeSelect.selectOption('OUTPUT');
            await titleInput.fill('Output Node');
            await createNodeBtn.click();

            await typeSelect.selectOption('ACTIVITY');
            await titleInput.fill('Orphan Activity Node');
            await createNodeBtn.click();

            await expect(page.getByText('Orphan Activity Node')).toBeVisible();

            const draftVersion = await admin
                .from('toc_versions')
                .select('id')
                .eq('project_id', projectId)
                .eq('tenant_id', orgId)
                .eq('status', 'DRAFT')
                .single();
            if (draftVersion.error || !draftVersion.data) throw new Error(draftVersion.error?.message || 'draft lookup failed');

            const nodes = await admin
                .from('toc_nodes')
                .select('id,title')
                .eq('toc_version_id', draftVersion.data.id)
                .eq('tenant_id', orgId);
            if (nodes.error || !nodes.data) throw new Error(nodes.error?.message || 'nodes lookup failed');

            const goal = nodes.data.find((n) => n.title === 'Goal Node');
            const outcome = nodes.data.find((n) => n.title === 'Outcome Node');
            const output = nodes.data.find((n) => n.title === 'Output Node');
            const orphan = nodes.data.find((n) => n.title === 'Orphan Activity Node');
            if (!goal || !outcome || !output || !orphan) throw new Error('expected nodes not found');

            const edge1 = await admin.from('toc_edges').insert({
                tenant_id: orgId,
                toc_version_id: draftVersion.data.id,
                source_node_id: goal.id,
                target_node_id: outcome.id,
                edge_type: 'CONTRIBUTES_TO',
                created_by: testUser.id,
            });
            if (edge1.error) throw new Error(edge1.error.message);

            const edge2 = await admin.from('toc_edges').insert({
                tenant_id: orgId,
                toc_version_id: draftVersion.data.id,
                source_node_id: outcome.id,
                target_node_id: output.id,
                edge_type: 'CONTRIBUTES_TO',
                created_by: testUser.id,
            });
            if (edge2.error) throw new Error(edge2.error.message);

            await page.getByTestId('publish-button').click();
            await expect(page.getByText(/Publish blocked: Gate A failed/i)).toBeVisible();

            const edge3 = await admin.from('toc_edges').insert({
                tenant_id: orgId,
                toc_version_id: draftVersion.data.id,
                source_node_id: output.id,
                target_node_id: orphan.id,
                edge_type: 'CONTRIBUTES_TO',
                created_by: testUser.id,
            });
            if (edge3.error) throw new Error(edge3.error.message);

            await page.getByTestId('publish-button').click();
            await expect(page.getByText(/Publish blocked:/i)).toHaveCount(0);

            const versionSelect = page.locator('div:has(span:has-text("Version:")) select').first();
            const publishedValue = await versionSelect.evaluate((el) => {
                const options = Array.from((el as HTMLSelectElement).options);
                return options.find((o) => o.text.includes('(PUBLISHED)'))?.value ?? '';
            });
            expect(publishedValue).not.toBe('');

            await versionSelect.selectOption(publishedValue);
            await expect(page).toHaveURL(/\/app\/projects\/.+\/toc\?v=/);
            await expect(page.getByText(/Editing is disabled for published versions/i)).toBeVisible();
        } finally {
            if (projectId) {
                await admin.from('toc_versions').delete().eq('project_id', projectId);
                await admin.from('analysis_snapshots').delete().eq('project_id', projectId);
                await admin.from('projects').delete().eq('id', projectId);
            }
            if (orgId) {
                await admin.from('org_memberships').delete().eq('org_id', orgId);
                await admin.from('organizations').delete().eq('id', orgId);
            }
        }
    });
});
