-- ESSET MEAL Demo Seed
-- Purpose: Quickly populate a clean environment with demo data.
-- Usage:
-- 1. Find your tenant_id (organization id) and project_id.
-- 2. Run this script in the Supabase SQL Editor, replacing the variables at the top.

/*
DO NOT RUN IN PRODUCTION. This is for local/staging demo readiness.
*/

DO $$
DECLARE
    -- REPLACE THESE WITH YOUR ACTUAL IDS
    target_tenant_id UUID := (SELECT id FROM organizations LIMIT 1);
    target_project_id UUID := (SELECT id FROM projects WHERE tenant_id = (SELECT id FROM organizations LIMIT 1) LIMIT 1);
    
    new_version_id UUID;
    goal_node_id UUID;
    outcome_node_id UUID;
    edge_id UUID;
    snapshot_id UUID;
BEGIN
    -- Ensure we have a tenant and project
    IF target_tenant_id IS NULL THEN
        RAISE NOTICE 'No organization found. Please create one first.';
        RETURN;
    END IF;

    IF target_project_id IS NULL THEN
        INSERT INTO projects (title, description, tenant_id)
        VALUES ('Demo Readiness Project', 'Automatically generated seed project for end-to-end demo.', target_tenant_id)
        RETURNING id INTO target_project_id;
    END IF;

    -- 1. Create Analysis Snapshot
    INSERT INTO analysis_snapshots (tenant_id, project_id, title, snapshot)
    VALUES (
        target_tenant_id, 
        target_project_id, 
        'Baseline Situational Analysis',
        '{
            "context_summary": "Initial baseline for food security demo.",
            "problem_statement": "High waste in local markets.",
            "stakeholders": "Vendors, Customers, Waste Management",
            "evidence_notes": "Observation data collected Jan 2026.",
            "key_assumptions": "Stable market conditions.",
            "risks_and_mitigations": "Low participation risk."
        }'::jsonb
    ) RETURNING id INTO snapshot_id;

    -- 2. Create ToC Version (Draft)
    INSERT INTO toc_versions (tenant_id, project_id, analysis_snapshot_id, version_number, status)
    VALUES (target_tenant_id, target_project_id, snapshot_id, 1, 'DRAFT')
    RETURNING id INTO new_version_id;

    -- 3. Create Nodes
    INSERT INTO toc_nodes (tenant_id, toc_version_id, node_type, title, description, pos_x, pos_y)
    VALUES (target_tenant_id, new_version_id, 'GOAL', 'Reduced Food Waste', '15% reduction across 3 months', 400, 50)
    RETURNING id INTO goal_node_id;

    INSERT INTO toc_nodes (tenant_id, toc_version_id, node_type, title, description, pos_x, pos_y)
    VALUES (target_tenant_id, new_version_id, 'OUTCOME', 'Community Composting Active', 'Weekly collections from all vendors', 400, 300)
    RETURNING id INTO outcome_node_id;

    -- 4. Create Edge
    INSERT INTO toc_edges (tenant_id, toc_version_id, source_node_id, target_node_id, edge_type)
    VALUES (target_tenant_id, new_version_id, outcome_node_id, goal_node_id, 'CONTRIBUTES_TO')
    RETURNING id INTO edge_id;

    -- 5. Create Assumptions
    INSERT INTO toc_assumptions (tenant_id, toc_version_id, node_id, assumption_text, risk_level)
    VALUES (target_tenant_id, new_version_id, outcome_node_id, 'Community is willing to participate', 'MEDIUM');

    INSERT INTO toc_edge_assumptions (tenant_id, toc_version_id, edge_id, assumption_text, risk_level)
    VALUES (target_tenant_id, new_version_id, edge_id, 'Composting directly impacts local waste volume', 'HIGH');

    RAISE NOTICE 'Demo data seeded successfully for tenant % and project %', target_tenant_id, target_project_id;
END $$;
