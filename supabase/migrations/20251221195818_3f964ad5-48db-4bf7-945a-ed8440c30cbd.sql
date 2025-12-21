-- Custom field definitions table
CREATE TABLE public.custom_field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'user', 'url')),
  default_value TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  options JSONB, -- For select/multiselect: [{"value": "opt1", "label": "Option 1"}]
  validation_rules JSONB, -- e.g., {"min": 0, "max": 100, "pattern": "..."}
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Custom field contexts (which projects/issue types use which fields)
CREATE TABLE public.custom_field_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  issue_type_id UUID REFERENCES public.issue_types(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(field_id, project_id, issue_type_id)
);

-- Custom field values (actual values stored per issue)
CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_date TIMESTAMP WITH TIME ZONE,
  value_json JSONB, -- For multiselect, complex values
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(issue_id, field_id)
);

-- Enable RLS
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_field_definitions
CREATE POLICY "Authenticated can view custom field definitions" ON public.custom_field_definitions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage custom field definitions" ON public.custom_field_definitions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for custom_field_contexts
CREATE POLICY "Users can view custom field contexts" ON public.custom_field_contexts
  FOR SELECT USING (
    project_id IS NULL OR 
    is_project_member(auth.uid(), project_id) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage custom field contexts" ON public.custom_field_contexts
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = custom_field_contexts.project_id 
      AND projects.lead_id = auth.uid()
    )
  );

-- RLS Policies for custom_field_values
CREATE POLICY "Project members can view custom field values" ON public.custom_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM issues i 
      WHERE i.id = custom_field_values.issue_id 
      AND (is_project_member(auth.uid(), i.project_id) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Project members can manage custom field values" ON public.custom_field_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM issues i 
      WHERE i.id = custom_field_values.issue_id 
      AND (is_project_member(auth.uid(), i.project_id) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_custom_field_definitions_updated_at
  BEFORE UPDATE ON public.custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default custom fields
INSERT INTO public.custom_field_definitions (name, description, field_type, position) VALUES
  ('Epic Link', 'Link to parent epic', 'text', 1),
  ('Sprint Points', 'Story points for sprint planning', 'number', 2),
  ('Acceptance Criteria', 'Criteria for story completion', 'textarea', 3),
  ('Target Release', 'Target release version', 'select', 4),
  ('Team', 'Assigned team', 'select', 5),
  ('Start Date', 'Planned start date', 'date', 6),
  ('Business Value', 'Business value score', 'number', 7),
  ('External Reference', 'External ticket/reference URL', 'url', 8);

-- Add options for select fields
UPDATE public.custom_field_definitions 
SET options = '[{"value": "v1.0", "label": "Version 1.0"}, {"value": "v1.1", "label": "Version 1.1"}, {"value": "v2.0", "label": "Version 2.0"}]'::jsonb
WHERE name = 'Target Release';

UPDATE public.custom_field_definitions 
SET options = '[{"value": "frontend", "label": "Frontend"}, {"value": "backend", "label": "Backend"}, {"value": "devops", "label": "DevOps"}, {"value": "qa", "label": "QA"}]'::jsonb
WHERE name = 'Team';