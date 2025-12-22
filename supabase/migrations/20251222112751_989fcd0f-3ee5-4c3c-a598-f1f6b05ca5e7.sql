-- Add draft workflow support columns to workflows table
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS draft_of UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient draft lookups
CREATE INDEX IF NOT EXISTS idx_workflows_draft_of ON public.workflows(draft_of) WHERE draft_of IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.workflows.is_draft IS 'Indicates if this workflow is a draft version';
COMMENT ON COLUMN public.workflows.draft_of IS 'References the parent workflow this is a draft of';
COMMENT ON COLUMN public.workflows.published_at IS 'Timestamp when the workflow was last published';