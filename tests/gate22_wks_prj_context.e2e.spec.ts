import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Gate 22: Active Org + Invisible Walls', () => {
    test.beforeEach(({ }, testInfo) => {
        if (testInfo.project.name !== 'auth') {
            test.skip();
        }
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            test.skip();
        }
    });

    test('project list follows active org and inaccessible project returns not found', async ({ page }) => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const stamp = Date.now();
        const orgAName = `Slice2 Org A ${stamp}`;
        const orgBName = `Slice2 Org B ${stamp}`;
        const orgCName = `Slice2 Org C ${stamp}`;
        const projectAName = `Slice2 Project A ${stamp}`;
        const projectBName = `Slice2 Project B ${stamp}`;

        const outsiderEmail = `slice2-outsider-${stamp}@essetmeal.local`;

        const { data: listUsers, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) {
            throw new Error(usersError.message);
        }

        const testUser = listUsers.users.find((u) => u.email === 'e2e.test@essetmeal.local');
        if (!testUser) {
            test.skip();
            return;
        }

        const { data: outsiderCreate, error: outsiderError } = await supabase.auth.admin.createUser({
            email: outsiderEmail,
            password: outsiderPassword,
            email_confirm: true,
        });
        if (outsiderError || !outsiderCreate.user) {
            throw new Error(outsiderError?.message || 'Could not create outsider user');
        }

        const outsiderId = outsiderCreate.user.id;
        let orgAId = '';
        let orgBId = '';
        let orgCId = '';
        let projectAId = '';
        let projectBId = '';
        let projectCId = '';

        try {
            const orgA = await supabase.from('organizations').insert({ name: orgAName, created_by: testUser.id }).select('id').single();
            if (orgA.error || !orgA.data) throw new Error(orgA.error?.message || 'orgA create failed');
            orgAId = orgA.data.id;

            const orgB = await supabase.from('organizations').insert({ name: orgBName, created_by: testUser.id }).select('id').single();
            if (orgB.error || !orgB.data) throw new Error(orgB.error?.message || 'orgB create failed');
            orgBId = orgB.data.id;

            const orgC = await supabase.from('organizations').insert({ name: orgCName, created_by: outsiderId }).select('id').single();
            if (orgC.error || !orgC.data) throw new Error(orgC.error?.message || 'orgC create failed');
            orgCId = orgC.data.id;

            const projectA = await supabase
                .from('projects')
                .insert({ tenant_id: orgAId, title: projectAName, created_by: testUser.id })
                .select('id')
                .single();
            if (projectA.error || !projectA.data) throw new Error(projectA.error?.message || 'projectA create failed');
            projectAId = projectA.data.id;

            const projectB = await supabase
                .from('projects')
                .insert({ tenant_id: orgBId, title: projectBName, created_by: testUser.id })
                .select('id')
                .single();
            if (projectB.error || !projectB.data) throw new Error(projectB.error?.message || 'projectB create failed');
            projectBId = projectB.data.id;

            const projectC = await supabase
                .from('projects')
                .insert({ tenant_id: orgCId, title: `Slice2 Project C ${stamp}`, created_by: outsiderId })
                .select('id')
                .single();
            if (projectC.error || !projectC.data) throw new Error(projectC.error?.message || 'projectC create failed');
            projectCId = projectC.data.id;

            const setActive = await supabase
                .from('profiles')
                .update({ active_tenant_id: orgAId })
                .eq('id', testUser.id);
            if (setActive.error) throw new Error(setActive.error.message);

            await page.goto('/app/projects');
            await expect(page.getByText(projectAName)).toBeVisible();
            await expect(page.getByText(projectBName)).toHaveCount(0);

            await page.getByRole('link', { name: 'Switch' }).click();
            await expect(page).toHaveURL(/\/app\/workspaces$/);
            await page.getByRole('button', { name: new RegExp(orgBName) }).click();

            await expect(page).toHaveURL(/\/app$/);
            await page.goto('/app/projects');
            await expect(page.getByText(projectBName)).toBeVisible();
            await expect(page.getByText(projectAName)).toHaveCount(0);

            await page.goto(`/app/projects/${projectCId}`);
            await expect(page.getByText(/not found|404/i).first()).toBeVisible();
        } finally {
            if (orgAId || orgBId || orgCId) {
                await supabase.from('reporting_periods').delete().in('tenant_id', [orgAId, orgBId, orgCId].filter(Boolean));
                await supabase.from('projects').delete().in('id', [projectAId, projectBId, projectCId].filter(Boolean));
                await supabase.from('org_memberships').delete().in('org_id', [orgAId, orgBId, orgCId].filter(Boolean));
                await supabase.from('organizations').delete().in('id', [orgAId, orgBId, orgCId].filter(Boolean));
            }
            await supabase.auth.admin.deleteUser(outsiderId);
        }
    });
});

