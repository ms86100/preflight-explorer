-- Phase 1: Database Schema Updates for Components and Releases

-- 1.1 Add issue_components junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.issue_components (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(issue_id, component_id)
);

-- Enable RLS
ALTER TABLE public.issue_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issue_components
CREATE POLICY "Users can view issue components" ON public.issue_components
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue components" ON public.issue_components
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issue_components_issue_id ON public.issue_components(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_components_component_id ON public.issue_components(component_id);

-- 1.2 Add issue_fix_versions junction table for Fix Version/s
CREATE TABLE IF NOT EXISTS public.issue_fix_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(issue_id, version_id)
);

-- Enable RLS
ALTER TABLE public.issue_fix_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issue_fix_versions
CREATE POLICY "Users can view issue fix versions" ON public.issue_fix_versions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue fix versions" ON public.issue_fix_versions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issue_fix_versions_issue_id ON public.issue_fix_versions(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_fix_versions_version_id ON public.issue_fix_versions(version_id);

-- 1.3 Add issue_affects_versions junction table for Affects Version/s
CREATE TABLE IF NOT EXISTS public.issue_affects_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(issue_id, version_id)
);

-- Enable RLS
ALTER TABLE public.issue_affects_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issue_affects_versions
CREATE POLICY "Users can view issue affects versions" ON public.issue_affects_versions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue affects versions" ON public.issue_affects_versions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issue_affects_versions_issue_id ON public.issue_affects_versions(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_affects_versions_version_id ON public.issue_affects_versions(version_id);

-- 1.4 Enhance components table with default_assignee_type and is_archived
-- Add default_assignee_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'default_assignee_type') THEN
        CREATE TYPE public.default_assignee_type AS ENUM ('component_lead', 'project_lead', 'project_default', 'unassigned');
    END IF;
END$$;

-- Add new columns to components table
ALTER TABLE public.components 
ADD COLUMN IF NOT EXISTS default_assignee_type public.default_assignee_type DEFAULT 'unassigned',
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;