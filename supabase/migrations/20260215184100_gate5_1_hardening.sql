-- Gate 5.1: Hardening Patch
-- Fixes: tenant-consistency in RLS, clone duplication bug, assumption triggers
-- Path: supabase/migrations/20260215184100_gate5_1_hardening.sql

BEGIN;

-------------------------------------------------------------------------------
-- A) RPC FIXES — DROP & RECREATE WITH CLEAN IMPLEMENTATIONS
-------------------------------------------------------------------------------

-- A1) publish_toc_version
CREATE OR REPLACE FUNCTION public.publish_toc_version(
    _tenant_id uuid,
    _project_id uuid,
    _version_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Require org admin
    IF NOT public.is_org_admin(_tenant_id) THEN
        RAISE EXCEPTION 'Unauthorized: Requires org admin role';
    END IF;

    -- Update only if row matches all ownership criteria
    UPDATE public.toc_versions
    SET status = 'PUBLISHED',
        published_at = now()
    WHERE id = _version_id
      AND tenant_id = _tenant_id
      AND project_id = _project_id
      AND status = 'DRAFT';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Draft version not found or ownership mismatch (tenant_id/project_id/status)';
    END IF;
END;
$$;

-- A2) create_toc_draft — clean single-pass clone
CREATE OR REPLACE FUNCTION public.create_toc_draft(
    _tenant_id uuid,
    _project_id uuid,
    _analysis_snapshot_id uuid,
    _from_version_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _new_version_id uuid;
    _next_ver int;
    _r RECORD;
    _new_node_id uuid;
    _new_edge_id uuid;
BEGIN
    -- 1. Security: must be tenant member
    IF NOT public.is_tenant_member(_tenant_id) THEN
        RAISE EXCEPTION 'Unauthorized: Not a member of this tenant';
    END IF;

    -- 2. Validate project belongs to tenant
    IF NOT EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = _project_id AND tenant_id = _tenant_id
    ) THEN
        RAISE EXCEPTION 'Project not found or does not belong to tenant';
    END IF;

    -- 3. Validate analysis snapshot belongs to tenant + project
    IF NOT EXISTS (
        SELECT 1 FROM public.analysis_snapshots
        WHERE id = _analysis_snapshot_id
          AND tenant_id = _tenant_id
          AND project_id = _project_id
    ) THEN
        RAISE EXCEPTION 'Analysis snapshot not found or does not belong to tenant/project';
    END IF;

    -- 4. Ensure no existing DRAFT for this project+tenant
    IF EXISTS (
        SELECT 1 FROM public.toc_versions
        WHERE tenant_id = _tenant_id
          AND project_id = _project_id
          AND status = 'DRAFT'
    ) THEN
        RAISE EXCEPTION 'A draft already exists for this project';
    END IF;

    -- 5. Compute next version number (scoped to tenant+project)
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO _next_ver
    FROM public.toc_versions
    WHERE tenant_id = _tenant_id
      AND project_id = _project_id;

    -- 6. Insert new draft version
    INSERT INTO public.toc_versions (
        tenant_id, project_id, analysis_snapshot_id,
        status, version_number, created_by
    )
    VALUES (
        _tenant_id, _project_id, _analysis_snapshot_id,
        'DRAFT', _next_ver, auth.uid()
    )
    RETURNING id INTO _new_version_id;

    -- 7. If no source version, return the empty draft
    IF _from_version_id IS NULL THEN
        RETURN _new_version_id;
    END IF;

    -- 8. Validate source version belongs to same tenant+project
    IF NOT EXISTS (
        SELECT 1 FROM public.toc_versions
        WHERE id = _from_version_id
          AND tenant_id = _tenant_id
          AND project_id = _project_id
    ) THEN
        RAISE EXCEPTION 'Source version not found or does not belong to tenant/project';
    END IF;

    -- 9. Create temp mapping table for node IDs
    CREATE TEMP TABLE _node_map (
        old_id uuid NOT NULL,
        new_id uuid NOT NULL
    ) ON COMMIT DROP;

    CREATE TEMP TABLE _edge_map (
        old_id uuid NOT NULL,
        new_id uuid NOT NULL
    ) ON COMMIT DROP;

    -- 10. Clone nodes (single cursor pass) and build mapping
    FOR _r IN
        SELECT * FROM public.toc_nodes
        WHERE toc_version_id = _from_version_id
          AND tenant_id = _tenant_id
    LOOP
        INSERT INTO public.toc_nodes (
            tenant_id, toc_version_id, node_type,
            title, description, metadata
        )
        VALUES (
            _tenant_id, _new_version_id, _r.node_type,
            _r.title, _r.description, _r.metadata
        )
        RETURNING id INTO _new_node_id;

        INSERT INTO _node_map (old_id, new_id)
        VALUES (_r.id, _new_node_id);
    END LOOP;

    -- 11. Clone node assumptions using node mapping
    INSERT INTO public.toc_assumptions (
        tenant_id, toc_version_id, node_id,
        assumption_text, risk_level
    )
    SELECT
        _tenant_id, _new_version_id, nm.new_id,
        a.assumption_text, a.risk_level
    FROM public.toc_assumptions a
    JOIN _node_map nm ON nm.old_id = a.node_id
    WHERE a.toc_version_id = _from_version_id
      AND a.tenant_id = _tenant_id;

    -- 12. Clone edges using mapped node IDs and build edge mapping
    FOR _r IN
        SELECT e.*, nm_s.new_id AS new_source, nm_t.new_id AS new_target
        FROM public.toc_edges e
        JOIN _node_map nm_s ON nm_s.old_id = e.source_node_id
        JOIN _node_map nm_t ON nm_t.old_id = e.target_node_id
        WHERE e.toc_version_id = _from_version_id
          AND e.tenant_id = _tenant_id
    LOOP
        INSERT INTO public.toc_edges (
            tenant_id, toc_version_id,
            source_node_id, target_node_id, edge_type
        )
        VALUES (
            _tenant_id, _new_version_id,
            _r.new_source, _r.new_target, _r.edge_type
        )
        RETURNING id INTO _new_edge_id;

        INSERT INTO _edge_map (old_id, new_id)
        VALUES (_r.id, _new_edge_id);
    END LOOP;

    -- 13. Clone edge assumptions using edge mapping
    INSERT INTO public.toc_edge_assumptions (
        tenant_id, toc_version_id, edge_id,
        assumption_text, risk_level
    )
    SELECT
        _tenant_id, _new_version_id, em.new_id,
        ea.assumption_text, ea.risk_level
    FROM public.toc_edge_assumptions ea
    JOIN _edge_map em ON em.old_id = ea.edge_id
    WHERE ea.toc_version_id = _from_version_id
      AND ea.tenant_id = _tenant_id;

    RETURN _new_version_id;
END;
$$;

-------------------------------------------------------------------------------
-- B) RLS POLICY HARDENING — DROP ALL GATE 5 POLICIES, RECREATE EXPLICIT
-------------------------------------------------------------------------------

-- B1) analysis_snapshots
DROP POLICY IF EXISTS "analysis_snapshots_select" ON public.analysis_snapshots;
DROP POLICY IF EXISTS "analysis_snapshots_insert" ON public.analysis_snapshots;
DROP POLICY IF EXISTS "analysis_snapshots_update_delete" ON public.analysis_snapshots;
DROP POLICY IF EXISTS "analysis_snapshots_update" ON public.analysis_snapshots;
DROP POLICY IF EXISTS "analysis_snapshots_delete" ON public.analysis_snapshots;

CREATE POLICY "analysis_snapshots_select" ON public.analysis_snapshots
    FOR SELECT TO authenticated
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "analysis_snapshots_insert" ON public.analysis_snapshots
    FOR INSERT TO authenticated
    WITH CHECK (public.is_tenant_member(tenant_id) AND created_by = auth.uid());

CREATE POLICY "analysis_snapshots_update" ON public.analysis_snapshots
    FOR UPDATE TO authenticated
    USING (public.is_org_admin(tenant_id))
    WITH CHECK (public.is_org_admin(tenant_id));

CREATE POLICY "analysis_snapshots_delete" ON public.analysis_snapshots
    FOR DELETE TO authenticated
    USING (public.is_org_admin(tenant_id));

-- B2) toc_versions
DROP POLICY IF EXISTS "toc_versions_select" ON public.toc_versions;
DROP POLICY IF EXISTS "toc_versions_insert" ON public.toc_versions;
DROP POLICY IF EXISTS "toc_versions_update_delete" ON public.toc_versions;
DROP POLICY IF EXISTS "toc_versions_update" ON public.toc_versions;
DROP POLICY IF EXISTS "toc_versions_delete" ON public.toc_versions;

CREATE POLICY "toc_versions_select" ON public.toc_versions
    FOR SELECT TO authenticated
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_versions_insert" ON public.toc_versions
    FOR INSERT TO authenticated
    WITH CHECK (public.is_tenant_member(tenant_id) AND created_by = auth.uid());

CREATE POLICY "toc_versions_update" ON public.toc_versions
    FOR UPDATE TO authenticated
    USING (public.is_org_admin(tenant_id))
    WITH CHECK (public.is_org_admin(tenant_id));

CREATE POLICY "toc_versions_delete" ON public.toc_versions
    FOR DELETE TO authenticated
    USING (public.is_org_admin(tenant_id));

-- B3) toc_nodes — tenant+draft consistency
DROP POLICY IF EXISTS "toc_nodes_select" ON public.toc_nodes;
DROP POLICY IF EXISTS "toc_nodes_modify" ON public.toc_nodes;
DROP POLICY IF EXISTS "toc_nodes_insert" ON public.toc_nodes;
DROP POLICY IF EXISTS "toc_nodes_update" ON public.toc_nodes;
DROP POLICY IF EXISTS "toc_nodes_delete" ON public.toc_nodes;

CREATE POLICY "toc_nodes_select" ON public.toc_nodes
    FOR SELECT TO authenticated
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_nodes_insert" ON public.toc_nodes
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_nodes_update" ON public.toc_nodes
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_nodes_delete" ON public.toc_nodes
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

-- B4) toc_edges — tenant+draft consistency
DROP POLICY IF EXISTS "toc_edges_select" ON public.toc_edges;
DROP POLICY IF EXISTS "toc_edges_modify" ON public.toc_edges;
DROP POLICY IF EXISTS "toc_edges_insert" ON public.toc_edges;
DROP POLICY IF EXISTS "toc_edges_update" ON public.toc_edges;
DROP POLICY IF EXISTS "toc_edges_delete" ON public.toc_edges;

CREATE POLICY "toc_edges_select" ON public.toc_edges
    FOR SELECT TO authenticated
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_edges_insert" ON public.toc_edges
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_edges_update" ON public.toc_edges
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_edges_delete" ON public.toc_edges
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

-- B5) toc_assumptions — tenant+draft consistency
DROP POLICY IF EXISTS "toc_assumptions_select" ON public.toc_assumptions;
DROP POLICY IF EXISTS "toc_assumptions_modify" ON public.toc_assumptions;
DROP POLICY IF EXISTS "toc_assumptions_insert" ON public.toc_assumptions;
DROP POLICY IF EXISTS "toc_assumptions_update" ON public.toc_assumptions;
DROP POLICY IF EXISTS "toc_assumptions_delete" ON public.toc_assumptions;

CREATE POLICY "toc_assumptions_select" ON public.toc_assumptions
    FOR SELECT TO authenticated
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_assumptions_insert" ON public.toc_assumptions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_assumptions_update" ON public.toc_assumptions
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_assumptions_delete" ON public.toc_assumptions
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

-- B6) toc_edge_assumptions — tenant+draft consistency
DROP POLICY IF EXISTS "toc_edge_assumptions_select" ON public.toc_edge_assumptions;
DROP POLICY IF EXISTS "toc_edge_assumptions_modify" ON public.toc_edge_assumptions;
DROP POLICY IF EXISTS "toc_edge_assumptions_insert" ON public.toc_edge_assumptions;
DROP POLICY IF EXISTS "toc_edge_assumptions_update" ON public.toc_edge_assumptions;
DROP POLICY IF EXISTS "toc_edge_assumptions_delete" ON public.toc_edge_assumptions;

CREATE POLICY "toc_edge_assumptions_select" ON public.toc_edge_assumptions
    FOR SELECT TO authenticated
    USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_edge_assumptions_insert" ON public.toc_edge_assumptions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_edge_assumptions_update" ON public.toc_edge_assumptions
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

CREATE POLICY "toc_edge_assumptions_delete" ON public.toc_edge_assumptions
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = tenant_id
        )
    );

-------------------------------------------------------------------------------
-- C) CONSISTENCY TRIGGERS HARDENING
-------------------------------------------------------------------------------

-- C1) Edge consistency — strengthen to check tenant_id too
CREATE OR REPLACE FUNCTION public.check_toc_edge_version_consistency()
RETURNS TRIGGER AS $$
DECLARE
    _source RECORD;
    _target RECORD;
BEGIN
    -- Verify source node exists
    SELECT id, toc_version_id, tenant_id INTO _source
    FROM public.toc_nodes WHERE id = NEW.source_node_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Edge source node % does not exist', NEW.source_node_id;
    END IF;

    -- Verify target node exists
    SELECT id, toc_version_id, tenant_id INTO _target
    FROM public.toc_nodes WHERE id = NEW.target_node_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Edge target node % does not exist', NEW.target_node_id;
    END IF;

    -- Version consistency
    IF _source.toc_version_id <> NEW.toc_version_id THEN
        RAISE EXCEPTION 'Source node version (%) does not match edge version (%)',
            _source.toc_version_id, NEW.toc_version_id;
    END IF;

    IF _target.toc_version_id <> NEW.toc_version_id THEN
        RAISE EXCEPTION 'Target node version (%) does not match edge version (%)',
            _target.toc_version_id, NEW.toc_version_id;
    END IF;

    -- Tenant consistency
    IF _source.tenant_id <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Source node tenant (%) does not match edge tenant (%)',
            _source.tenant_id, NEW.tenant_id;
    END IF;

    IF _target.tenant_id <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Target node tenant (%) does not match edge tenant (%)',
            _target.tenant_id, NEW.tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger (already exists, but DROP IF EXISTS for safety)
DROP TRIGGER IF EXISTS toc_edge_version_consistency_trigger ON public.toc_edges;
CREATE TRIGGER toc_edge_version_consistency_trigger
    BEFORE INSERT OR UPDATE ON public.toc_edges
    FOR EACH ROW EXECUTE FUNCTION public.check_toc_edge_version_consistency();

-- C2) Node assumption consistency — ensure node has same tenant+version
CREATE OR REPLACE FUNCTION public.check_toc_assumption_consistency()
RETURNS TRIGGER AS $$
DECLARE
    _node RECORD;
BEGIN
    SELECT id, toc_version_id, tenant_id INTO _node
    FROM public.toc_nodes WHERE id = NEW.node_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assumption references non-existent node %', NEW.node_id;
    END IF;

    IF _node.toc_version_id <> NEW.toc_version_id THEN
        RAISE EXCEPTION 'Node version (%) does not match assumption version (%)',
            _node.toc_version_id, NEW.toc_version_id;
    END IF;

    IF _node.tenant_id <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Node tenant (%) does not match assumption tenant (%)',
            _node.tenant_id, NEW.tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS toc_assumption_consistency_trigger ON public.toc_assumptions;
CREATE TRIGGER toc_assumption_consistency_trigger
    BEFORE INSERT OR UPDATE ON public.toc_assumptions
    FOR EACH ROW EXECUTE FUNCTION public.check_toc_assumption_consistency();

-- C3) Edge assumption consistency — ensure edge has same tenant+version
CREATE OR REPLACE FUNCTION public.check_toc_edge_assumption_consistency()
RETURNS TRIGGER AS $$
DECLARE
    _edge RECORD;
BEGIN
    SELECT id, toc_version_id, tenant_id INTO _edge
    FROM public.toc_edges WHERE id = NEW.edge_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Edge assumption references non-existent edge %', NEW.edge_id;
    END IF;

    IF _edge.toc_version_id <> NEW.toc_version_id THEN
        RAISE EXCEPTION 'Edge version (%) does not match edge assumption version (%)',
            _edge.toc_version_id, NEW.toc_version_id;
    END IF;

    IF _edge.tenant_id <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Edge tenant (%) does not match edge assumption tenant (%)',
            _edge.tenant_id, NEW.tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS toc_edge_assumption_consistency_trigger ON public.toc_edge_assumptions;
CREATE TRIGGER toc_edge_assumption_consistency_trigger
    BEFORE INSERT OR UPDATE ON public.toc_edge_assumptions
    FOR EACH ROW EXECUTE FUNCTION public.check_toc_edge_assumption_consistency();

COMMIT;
