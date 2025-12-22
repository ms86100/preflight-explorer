-- Create git_user_mappings table for mapping Git authors to system users
CREATE TABLE public.git_user_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.git_organizations(id) ON DELETE CASCADE,
  git_email TEXT NOT NULL,
  git_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, git_email)
);

-- Enable RLS
ALTER TABLE public.git_user_mappings ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone authenticated can view mappings
CREATE POLICY "Authenticated users can view git user mappings"
ON public.git_user_mappings
FOR SELECT
TO authenticated
USING (true);

-- Only admins or org creators can manage mappings
CREATE POLICY "Admins can manage git user mappings"
ON public.git_user_mappings
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM git_organizations 
    WHERE id = git_user_mappings.organization_id 
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM git_organizations 
    WHERE id = git_user_mappings.organization_id 
    AND created_by = auth.uid()
  )
);

-- Index for faster lookups
CREATE INDEX idx_git_user_mappings_email ON public.git_user_mappings(git_email);
CREATE INDEX idx_git_user_mappings_user ON public.git_user_mappings(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_git_user_mappings_updated_at
BEFORE UPDATE ON public.git_user_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-suggest user mappings based on email
CREATE OR REPLACE FUNCTION public.suggest_git_user_mapping(p_git_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find a profile with matching email
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = p_git_email
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$;