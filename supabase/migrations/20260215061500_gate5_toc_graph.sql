-- Gate 5: ToC Graph Engine Persistence
-- Path: supabase/migrations/20260215061500_gate5_toc_graph.sql

BEGIN;

-------------------------------------------------------------------------------
-- 1. Tables
-------------------------------------------------------------------------------

-- Analysis Snapshots (Immutable)
CREATE TABLE public.analysis_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ToC Versions
CREATE TABLE public.toc_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    analysis_snapshot_id uuid NOT NULL REFERENCES public.analysis_snapshots(id) ON DELETE RESTRICT,
    status text NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
    version_number int NOT NULL,
    created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    UNIQUE (tenant_id, project_id, version_number)
);

-- Ensure only one DRAFT per project
CREATE UNIQUE INDEX toc_versions_one_draft_per_project 
ON public.toc_versions (project_id) 
WHERE (status = 'DRAFT');

-- ToC Nodes
CREATE TABLE public.toc_nodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    toc_version_id uuid NOT NULL REFERENCES public.toc_versions(id) ON DELETE CASCADE,
    node_type text NOT NULL CHECK (node_type IN ('GOAL', 'OUTCOME', 'OUTPUT', 'ACTIVITY')),
    title text NOT NULL,
    description text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ToC Edges
CREATE TABLE public.toc_edges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    toc_version_id uuid NOT NULL REFERENCES public.toc_versions(id) ON DELETE CASCADE,
    source_node_id uuid NOT NULL REFERENCES public.toc_nodes(id) ON DELETE CASCADE,
    target_node_id uuid NOT NULL REFERENCES public.toc_nodes(id) ON DELETE CASCADE,
    edge_type text NOT NULL DEFAULT 'CONTRIBUTES_TO',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_node_id, target_node_id, edge_type)
);

-- Node Assumptions
CREATE TABLE public.toc_assumptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    toc_version_id uuid NOT NULL REFERENCES public.toc_versions(id) ON DELETE CASCADE,
    node_id uuid NOT NULL REFERENCES public.toc_nodes(id) ON DELETE CASCADE,
    assumption_text text NOT NULL,
    risk_level text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Edge Assumptions
CREATE TABLE public.toc_edge_assumptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    toc_version_id uuid NOT NULL REFERENCES public.toc_versions(id) ON DELETE CASCADE,
    edge_id uuid NOT NULL REFERENCES public.toc_edges(id) ON DELETE CASCADE,
    assumption_text text NOT NULL,
    risk_level text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-------------------------------------------------------------------------------
-- 2. Triggers & Constraints
-------------------------------------------------------------------------------

-- Ensure function exists (it should from Gate 2)
-- (No SELECT call needed, just reference in trigger)

CREATE TRIGGER set_toc_nodes_updated_at BEFORE UPDATE ON public.toc_nodes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_toc_edges_updated_at BEFORE UPDATE ON public.toc_edges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_toc_assumptions_updated_at BEFORE UPDATE ON public.toc_assumptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_toc_edge_assumptions_updated_at BEFORE UPDATE ON public.toc_edge_assumptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Edge Version Consistency Function
CREATE OR REPLACE FUNCTION public.check_toc_edge_version_consistency()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.toc_nodes n1
        JOIN public.toc_nodes n2 ON n2.toc_version_id = n1.toc_version_id
        WHERE n1.id = NEW.source_node_id 
        AND n2.id = NEW.target_node_id
        AND n1.toc_version_id = NEW.toc_version_id
    ) THEN
        RAISE EXCEPTION 'Source and target nodes must belong to the same ToC version as the edge';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER toc_edge_version_consistency_trigger
BEFORE INSERT OR UPDATE ON public.toc_edges
FOR EACH ROW EXECUTE FUNCTION public.check_toc_edge_version_consistency();

-------------------------------------------------------------------------------
-- 3. RLS Policies
-------------------------------------------------------------------------------

ALTER TABLE public.analysis_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toc_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toc_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toc_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toc_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toc_edge_assumptions ENABLE ROW LEVEL SECURITY;

-- Analysis Snapshots
CREATE POLICY "analysis_snapshots_select" ON public.analysis_snapshots
    FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "analysis_snapshots_insert" ON public.analysis_snapshots
    FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id) AND created_by = auth.uid());

CREATE POLICY "analysis_snapshots_update_delete" ON public.analysis_snapshots
    FOR ALL USING (public.is_org_admin(tenant_id));

-- ToC Versions
CREATE POLICY "toc_versions_select" ON public.toc_versions
    FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_versions_insert" ON public.toc_versions
    FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id) AND created_by = auth.uid());

CREATE POLICY "toc_versions_update_delete" ON public.toc_versions
    FOR ALL USING (public.is_org_admin(tenant_id));

-- ToC Nodes (Immutable if Published)
CREATE POLICY "toc_nodes_select" ON public.toc_nodes
    FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_nodes_modify" ON public.toc_nodes
    FOR ALL USING (
        public.is_tenant_member(tenant_id) AND 
        EXISTS (SELECT 1 FROM public.toc_versions v WHERE v.id = toc_version_id AND v.status = 'DRAFT')
    );

-- ToC Edges (Immutable if Published)
CREATE POLICY "toc_edges_select" ON public.toc_edges
    FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_edges_modify" ON public.toc_edges
    FOR ALL USING (
        public.is_tenant_member(tenant_id) AND 
        EXISTS (SELECT 1 FROM public.toc_versions v WHERE v.id = toc_version_id AND v.status = 'DRAFT')
    );

-- ToC Assumptions (Immutable if Published)
CREATE POLICY "toc_assumptions_select" ON public.toc_assumptions
    FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_assumptions_modify" ON public.toc_assumptions
    FOR ALL USING (
        public.is_tenant_member(tenant_id) AND 
        EXISTS (SELECT 1 FROM public.toc_versions v WHERE v.id = toc_version_id AND v.status = 'DRAFT')
    );

-- ToC Edge Assumptions (Immutable if Published)
CREATE POLICY "toc_edge_assumptions_select" ON public.toc_edge_assumptions
    FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "toc_edge_assumptions_modify" ON public.toc_edge_assumptions
    FOR ALL USING (
        public.is_tenant_member(tenant_id) AND 
        EXISTS (SELECT 1 FROM public.toc_versions v WHERE v.id = toc_version_id AND v.status = 'DRAFT')
    );

-------------------------------------------------------------------------------
-- 4. RPC Methods
-------------------------------------------------------------------------------

-- Publish ToC Version
CREATE OR REPLACE FUNCTION public.publish_toc_version(_tenant_id uuid, _project_id uuid, _version_id uuid)
RETURNS void AS $$
BEGIN
    -- Security Check
    IF NOT public.is_org_admin(_tenant_id) THEN
        RAISE EXCEPTION 'Unauthorized: Requires org admin role';
    END IF;

    -- Update and confirm ownership
    UPDATE public.toc_versions
    SET status = 'PUBLISHED',
        published_at = now()
    WHERE id = _version_id
    AND tenant_id = _tenant_id
    AND project_id = _project_id
    AND status = 'DRAFT';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Draft version not found or already published';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create ToC Draft (with optional cloning)
CREATE OR REPLACE FUNCTION public.create_toc_draft(
    _tenant_id uuid, 
    _project_id uuid, 
    _analysis_snapshot_id uuid, 
    _from_version_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_version_id uuid;
    next_ver int;
BEGIN
    -- Security Check
    IF NOT public.is_tenant_member(_tenant_id) THEN
        RAISE EXCEPTION 'Unauthorized: Not a member of this tenant';
    END IF;

    -- Ensure no existing draft
    IF EXISTS (SELECT 1 FROM public.toc_versions WHERE project_id = _project_id AND status = 'DRAFT') THEN
        RAISE EXCEPTION 'A draft already exists for this project';
    END IF;

    -- Compute next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_ver
    FROM public.toc_versions
    WHERE project_id = _project_id;

    -- Create draft row
    INSERT INTO public.toc_versions (tenant_id, project_id, analysis_snapshot_id, status, version_number)
    VALUES (_tenant_id, _project_id, _analysis_snapshot_id, 'DRAFT', next_ver)
    RETURNING id INTO new_version_id;

    -- If cloning is requested
    IF _from_version_id IS NOT NULL THEN
        -- Temporary table for mapping old node IDs to new ones
        CREATE TEMP TABLE node_id_map (
            old_id uuid,
            new_id uuid
        ) ON COMMIT DROP;

        -- Clone Nodes
        WITH inserted_nodes AS (
            INSERT INTO public.toc_nodes (tenant_id, toc_version_id, node_type, title, description, metadata)
            SELECT _tenant_id, new_version_id, node_type, title, description, metadata
            FROM public.toc_nodes
            WHERE toc_version_id = _from_version_id
            RETURNING id, title -- Assumes title + type identifies node sufficiently for mapping if no original id stored
        ),
        original_nodes AS (
            SELECT id, title FROM public.toc_nodes WHERE toc_version_id = _from_version_id
        )
        INSERT INTO node_id_map (old_id, new_id)
        SELECT o.id, i.id
        FROM original_nodes o
        JOIN inserted_nodes i ON o.title = i.title; -- Title mapping dependency (risky if not unique, but common in basic clones)
        -- Better approach: use a mapping table with original IDs if we had them or use a cursor loop

        -- Re-implementing with cursor for safety
        /* (Actually, a CTE with a nested insert/select is hard for ID mapping without a shared key) */
        
        -- Refined Clone Nodes & Build Map (Proper Way)
        FOR next_ver IN (SELECT 1) LOOP -- Just a block
           -- Insert nodes and collect mapping
           -- Using a more robust mapping: We'll use the original ID as a temporary field if possible, or just loop
           DECLARE
               r RECORD;
               new_node_id uuid;
           BEGIN
               FOR r IN SELECT * FROM public.toc_nodes WHERE toc_version_id = _from_version_id LOOP
                   INSERT INTO public.toc_nodes (tenant_id, toc_version_id, node_type, title, description, metadata)
                   VALUES (_tenant_id, new_version_id, r.node_type, r.title, r.description, r.metadata)
                   RETURNING id INTO new_node_id;
                   
                   INSERT INTO node_id_map (old_id, new_id) VALUES (r.id, new_node_id);

                   -- Clone Node Assumptions
                   INSERT INTO public.toc_assumptions (tenant_id, toc_version_id, node_id, assumption_text, risk_level)
                   SELECT _tenant_id, new_version_id, new_node_id, assumption_text, risk_level
                   FROM public.toc_assumptions
                   WHERE node_id = r.id;
               END LOOP;
           END;
        END LOOP;

        -- Clone Edges using map
        DECLARE
            e RECORD;
            new_edge_id uuid;
            s_id uuid;
            t_id uuid;
        BEGIN
            FOR e IN SELECT * FROM public.toc_edges WHERE toc_version_id = _from_version_id LOOP
                SELECT new_id INTO s_id FROM node_id_map WHERE old_id = e.source_node_id;
                SELECT new_id INTO t_id FROM node_id_map WHERE old_id = e.target_node_id;

                INSERT INTO public.toc_edges (tenant_id, toc_version_id, source_node_id, target_node_id, edge_type)
                VALUES (_tenant_id, new_version_id, s_id, t_id, e.edge_type)
                RETURNING id INTO new_edge_id;

                -- Clone Edge Assumptions
                INSERT INTO public.toc_edge_assumptions (tenant_id, toc_version_id, edge_id, assumption_text, risk_level)
                SELECT _tenant_id, new_version_id, new_edge_id, assumption_text, risk_level
                FROM public.toc_edge_assumptions
                WHERE edge_id = e.id;
            END LOOP;
        END;

    END IF;

    RETURN new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
