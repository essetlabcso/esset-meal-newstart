-- ESSET MEAL - Truly Idempotent Demo Seed
-- Purpose: Quickly populate a clean environment with demo data.
-- Safety: This script is for LOCAL/STAGING environments only. 
-- WARNING: DO NOT RUN ON PRODUCTION.
-- Version: Gate 13 Reconciliation

DO $$
DECLARE
    -- Deterministic Tenant and Project Discovery
    target_tenant_id UUID;
    target_project_id UUID;
    
    -- Resource IDs
    v_snapshot_id UUID;
    v_version_id UUID;
    v_goal_id UUID;
    v_outcome_id UUID;
    v_edge_id UUID;

    -- Constants for deterministic lookups
    c_project_title TEXT := 'Inductor Demonstration Project';
    c_snapshot_title TEXT := 'Baseline Situational analysis';
    c_goal_title TEXT := 'Reduced Food Waste';
    c_outcome_title TEXT := 'Community Composting Active';
BEGIN
    -- 0. Identify active tenant (organization)
    SELECT id INTO target_tenant_id FROM organizations LIMIT 1;
    IF target_tenant_id IS NULL THEN
        RAISE NOTICE 'No organization found. Please create one via UI first.';
        RETURN;
    END IF;

    -- 1. Ensure Project exists
    SELECT id INTO target_project_id FROM projects WHERE title = c_project_title AND tenant_id = target_tenant_id;
    IF target_project_id IS NULL THEN
        INSERT INTO projects (title, description, tenant_id)
        VALUES (c_project_title, 'Deterministic seed project for automated verification.', target_tenant_id)
        RETURNING id INTO target_project_id;
        RAISE NOTICE 'Created Project: %', c_project_title;
    ELSE
        RAISE NOTICE 'Project exists: %', c_project_title;
    END IF;

    -- 2. Ensure Analysis Snapshot exists
    SELECT id INTO v_snapshot_id FROM analysis_snapshots WHERE title = c_snapshot_title AND project_id = target_project_id;
    IF v_snapshot_id IS NULL THEN
        INSERT INTO analysis_snapshots (tenant_id, project_id, title, snapshot)
        VALUES (
            target_tenant_id, 
            target_project_id, 
            c_snapshot_title,
            '{
                "context_summary": "Idempotent baseline for food security demo.",
                "problem_statement": "High waste in local markets.",
                "stakeholders": "Vendors, Customers, Waste Management",
                "evidence_notes": "Observation data collected Jan 2026.",
                "key_assumptions": "Stable market conditions.",
                "risks_and_mitigations": "Low participation risk."
            }'::jsonb
        ) RETURNING id INTO v_snapshot_id;
        RAISE NOTICE 'Created Snapshot: %', c_snapshot_title;
    ELSE
        RAISE NOTICE 'Snapshot exists: %', c_snapshot_title;
    END IF;

    -- 3. Ensure ToC Version (Draft) exists
    -- We look for any DRAFT version for this project anchored to this snapshot
    SELECT id INTO v_version_id FROM toc_versions 
    WHERE project_id = target_project_id AND analysis_snapshot_id = v_snapshot_id AND status = 'DRAFT'
    ORDER BY version_number DESC LIMIT 1;

    IF v_version_id IS NULL THEN
        INSERT INTO toc_versions (tenant_id, project_id, analysis_snapshot_id, version_number, status)
        VALUES (target_tenant_id, target_project_id, v_snapshot_id, 1, 'DRAFT')
        RETURNING id INTO v_version_id;
        RAISE NOTICE 'Created ToC Draft version';
    ELSE
        RAISE NOTICE 'Reusing existing ToC Draft version: %', v_version_id;
    END IF;

    -- 4. Ensure Nodes exist
    -- GOAL
    SELECT id INTO v_goal_id FROM toc_nodes WHERE toc_version_id = v_version_id AND title = c_goal_title;
    IF v_goal_id IS NULL THEN
        INSERT INTO toc_nodes (tenant_id, toc_version_id, node_type, title, description, pos_x, pos_y)
        VALUES (target_tenant_id, v_version_id, 'GOAL', c_goal_title, '15% reduction across 3 months', 400, 50)
        RETURNING id INTO v_goal_id;
    END IF;

    -- OUTCOME
    SELECT id INTO v_outcome_id FROM toc_nodes WHERE toc_version_id = v_version_id AND title = c_outcome_title;
    IF v_outcome_id IS NULL THEN
        INSERT INTO toc_nodes (tenant_id, toc_version_id, node_type, title, description, pos_x, pos_y)
        VALUES (target_tenant_id, v_version_id, 'OUTCOME', c_outcome_title, 'Weekly collections from all vendors', 400, 300)
        RETURNING id INTO v_outcome_id;
    END IF;

    -- 5. Ensure Edge exists
    SELECT id INTO v_edge_id FROM toc_edges 
    WHERE toc_version_id = v_version_id AND source_node_id = v_outcome_id AND target_node_id = v_goal_id;
    
    IF v_edge_id IS NULL THEN
        INSERT INTO toc_edges (tenant_id, toc_version_id, source_node_id, target_node_id, edge_type)
        VALUES (target_tenant_id, v_version_id, v_outcome_id, v_goal_id, 'CONTRIBUTES_TO')
        RETURNING id INTO v_edge_id;
    END IF;

    -- 6. Ensure Assumptions exist
    -- Node Assumption
    IF NOT EXISTS (SELECT 1 FROM toc_assumptions WHERE node_id = v_outcome_id AND assumption_text = 'Community is willing to participate') THEN
        INSERT INTO toc_assumptions (tenant_id, toc_version_id, node_id, assumption_text, risk_level)
        VALUES (target_tenant_id, v_version_id, v_outcome_id, 'Community is willing to participate', 'MEDIUM');
    END IF;

    -- Edge Assumption
    IF NOT EXISTS (SELECT 1 FROM toc_edge_assumptions WHERE edge_id = v_edge_id AND assumption_text = 'Composting directly impacts local waste volume') THEN
        INSERT INTO toc_edge_assumptions (tenant_id, toc_version_id, edge_id, assumption_text, risk_level)
        VALUES (target_tenant_id, v_version_id, v_edge_id, 'Composting directly impacts local waste volume', 'HIGH');
    END IF;

    RAISE NOTICE 'Demo data reconciliation successful for tenant % and project %', target_tenant_id, target_project_id;
END $$;
