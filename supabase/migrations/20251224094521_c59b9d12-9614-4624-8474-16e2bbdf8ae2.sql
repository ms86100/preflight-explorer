-- Ensure audit logging never casts UUIDs to text (robust to text->uuid too)
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, (NEW.id)::uuid, 'create', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, (NEW.id)::uuid, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, (OLD.id)::uuid, 'delete', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate audit triggers to ensure they all point at the updated function
DROP TRIGGER IF EXISTS audit_issues_trigger ON public.issues;
CREATE TRIGGER audit_issues_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_projects_trigger ON public.projects;
CREATE TRIGGER audit_projects_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_sprints_trigger ON public.sprints;
CREATE TRIGGER audit_sprints_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_comments_trigger ON public.comments;
CREATE TRIGGER audit_comments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Ensure issue key trigger exists (used by CSV import and normal issue creation)
DROP TRIGGER IF EXISTS generate_issue_key_trigger ON public.issues;
CREATE TRIGGER generate_issue_key_trigger
  BEFORE INSERT ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.generate_issue_key();
