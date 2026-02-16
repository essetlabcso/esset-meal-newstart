-- Gate 7: ToC Visual Builder Layout Persistence
-- Add pos_x and pos_y to toc_nodes

ALTER TABLE public.toc_nodes 
ADD COLUMN IF NOT EXISTS pos_x double precision NOT NULL DEFAULT 0;

ALTER TABLE public.toc_nodes 
ADD COLUMN IF NOT EXISTS pos_y double precision NOT NULL DEFAULT 0;
