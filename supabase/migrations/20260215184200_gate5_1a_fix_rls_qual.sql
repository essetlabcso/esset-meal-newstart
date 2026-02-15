-- Gate 5.1a: Fix RLS policy tenant_id qualification
-- The prior migration had unqualified tenant_id in EXISTS subqueries,
-- which Postgres resolved as v.tenant_id = v.tenant_id (tautology).
-- This fix qualifies the outer table reference explicitly.
-- Path: supabase/migrations/20260215184200_gate5_1a_fix_rls_qual.sql

BEGIN;

-- toc_nodes
DROP POLICY IF EXISTS "toc_nodes_insert" ON public.toc_nodes;
DROP POLICY IF EXISTS "toc_nodes_update" ON public.toc_nodes;
DROP POLICY IF EXISTS "toc_nodes_delete" ON public.toc_nodes;

CREATE POLICY "toc_nodes_insert" ON public.toc_nodes
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(toc_nodes.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_nodes.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_nodes.tenant_id
        )
    );

CREATE POLICY "toc_nodes_update" ON public.toc_nodes
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(toc_nodes.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_nodes.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_nodes.tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(toc_nodes.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_nodes.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_nodes.tenant_id
        )
    );

CREATE POLICY "toc_nodes_delete" ON public.toc_nodes
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(toc_nodes.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_nodes.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_nodes.tenant_id
        )
    );

-- toc_edges
DROP POLICY IF EXISTS "toc_edges_insert" ON public.toc_edges;
DROP POLICY IF EXISTS "toc_edges_update" ON public.toc_edges;
DROP POLICY IF EXISTS "toc_edges_delete" ON public.toc_edges;

CREATE POLICY "toc_edges_insert" ON public.toc_edges
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(toc_edges.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edges.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edges.tenant_id
        )
    );

CREATE POLICY "toc_edges_update" ON public.toc_edges
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(toc_edges.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edges.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edges.tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(toc_edges.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edges.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edges.tenant_id
        )
    );

CREATE POLICY "toc_edges_delete" ON public.toc_edges
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(toc_edges.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edges.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edges.tenant_id
        )
    );

-- toc_assumptions
DROP POLICY IF EXISTS "toc_assumptions_insert" ON public.toc_assumptions;
DROP POLICY IF EXISTS "toc_assumptions_update" ON public.toc_assumptions;
DROP POLICY IF EXISTS "toc_assumptions_delete" ON public.toc_assumptions;

CREATE POLICY "toc_assumptions_insert" ON public.toc_assumptions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(toc_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_assumptions.tenant_id
        )
    );

CREATE POLICY "toc_assumptions_update" ON public.toc_assumptions
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(toc_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_assumptions.tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(toc_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_assumptions.tenant_id
        )
    );

CREATE POLICY "toc_assumptions_delete" ON public.toc_assumptions
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(toc_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_assumptions.tenant_id
        )
    );

-- toc_edge_assumptions
DROP POLICY IF EXISTS "toc_edge_assumptions_insert" ON public.toc_edge_assumptions;
DROP POLICY IF EXISTS "toc_edge_assumptions_update" ON public.toc_edge_assumptions;
DROP POLICY IF EXISTS "toc_edge_assumptions_delete" ON public.toc_edge_assumptions;

CREATE POLICY "toc_edge_assumptions_insert" ON public.toc_edge_assumptions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_tenant_member(toc_edge_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edge_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edge_assumptions.tenant_id
        )
    );

CREATE POLICY "toc_edge_assumptions_update" ON public.toc_edge_assumptions
    FOR UPDATE TO authenticated
    USING (
        public.is_tenant_member(toc_edge_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edge_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edge_assumptions.tenant_id
        )
    )
    WITH CHECK (
        public.is_tenant_member(toc_edge_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edge_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edge_assumptions.tenant_id
        )
    );

CREATE POLICY "toc_edge_assumptions_delete" ON public.toc_edge_assumptions
    FOR DELETE TO authenticated
    USING (
        public.is_tenant_member(toc_edge_assumptions.tenant_id)
        AND EXISTS (
            SELECT 1 FROM public.toc_versions v
            WHERE v.id = toc_edge_assumptions.toc_version_id
              AND v.status = 'DRAFT'
              AND v.tenant_id = toc_edge_assumptions.tenant_id
        )
    );

COMMIT;
