import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('S0: Snapshot-bound matrix export', () => {
  test.beforeEach(({}, testInfo) => {
    if (testInfo.project.name !== 'auth') {
      test.skip();
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip();
    }
  });

  test('published ToC exports deterministic matrix manifest hash', async ({ page }) => {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const stamp = Date.now();
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
    let publishedVersionId = '';
    let goalId = '';
    let outcomeId = '';

    try {
      const org = await admin
        .from('organizations')
        .insert({ name: `S0 Export Org ${stamp}`, created_by: testUser.id })
        .select('id')
        .single();
      if (org.error || !org.data) throw new Error(org.error?.message || 'org create failed');
      orgId = org.data.id;

      const setActive = await admin.from('profiles').update({ active_tenant_id: orgId }).eq('id', testUser.id);
      if (setActive.error) throw new Error(setActive.error.message);

      const project = await admin
        .from('projects')
        .insert({ tenant_id: orgId, title: `S0 Export Project ${stamp}`, created_by: testUser.id })
        .select('id')
        .single();
      if (project.error || !project.data) throw new Error(project.error?.message || 'project create failed');
      projectId = project.data.id;

      const snapshot = await admin
        .from('analysis_snapshots')
        .insert({ tenant_id: orgId, project_id: projectId, title: `S0 Export Snapshot ${stamp}`, snapshot: {}, created_by: testUser.id })
        .select('id')
        .single();
      if (snapshot.error || !snapshot.data) throw new Error(snapshot.error?.message || 'snapshot create failed');
      snapshotId = snapshot.data.id;

      const draft = await admin.rpc('create_toc_draft', {
        _tenant_id: orgId,
        _project_id: projectId,
        _analysis_snapshot_id: snapshotId,
      });
      if (draft.error || !draft.data) throw new Error(draft.error?.message || 'draft create failed');

      const goal = await admin
        .from('toc_nodes')
        .insert({ tenant_id: orgId, toc_version_id: draft.data, node_type: 'GOAL', title: 'Goal', created_by: testUser.id, primary_parent_id: null })
        .select('id')
        .single();
      if (goal.error || !goal.data) throw new Error(goal.error?.message || 'goal insert failed');
      goalId = goal.data.id;

      const outcome = await admin
        .from('toc_nodes')
        .insert({ tenant_id: orgId, toc_version_id: draft.data, node_type: 'OUTCOME', title: 'Outcome', created_by: testUser.id, primary_parent_id: goalId })
        .select('id')
        .single();
      if (outcome.error || !outcome.data) throw new Error(outcome.error?.message || 'outcome insert failed');
      outcomeId = outcome.data.id;

      const edge = await admin
        .from('toc_edges')
        .insert({
          tenant_id: orgId,
          toc_version_id: draft.data,
          source_node_id: goalId,
          target_node_id: outcomeId,
          edge_type: 'CONTRIBUTES_TO',
          edge_kind: 'causal',
          mechanism: 'Mechanism',
          confidence: 'medium',
          risk_flag: 'none',
          created_by: testUser.id,
        });
      if (edge.error) throw new Error(edge.error.message);

      const publish = await admin.rpc('publish_toc_version', {
        _tenant_id: orgId,
        _project_id: projectId,
        _version_id: draft.data,
      });
      if (publish.error || !publish.data) throw new Error(publish.error?.message || 'publish failed');
      publishedVersionId = (publish.data as { published_version_id: string }).published_version_id;

      await page.goto(`/app/projects/${projectId}/toc?v=${publishedVersionId}`);
      await expect(page.getByTestId('export-matrix-csv-button')).toBeVisible();
      await page.getByTestId('export-matrix-csv-button').click();
      await expect(page.getByText(/Matrix CSV exported\./i)).toBeVisible();
      await expect(page.getByText(/SHA-256:/i)).toBeVisible();
      await expect(page.getByText(/Manifest:/i)).toBeVisible();
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
