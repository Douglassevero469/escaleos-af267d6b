
-- Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System can insert (via triggers with security definer)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger function for packages
CREATE OR REPLACE FUNCTION public.audit_package_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (NEW.user_id, 'package_created', 'package', NEW.id,
      jsonb_build_object('client_id', NEW.client_id, 'status', NEW.status), 'success');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
      VALUES (NEW.user_id, 'package_status_changed', 'package', NEW.id,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
        CASE WHEN NEW.status = 'completed' THEN 'success' ELSE 'info' END);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_packages
  AFTER INSERT OR UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.audit_package_changes();

-- Trigger function for documents
CREATE OR REPLACE FUNCTION public.audit_document_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (NEW.user_id, 'document_created', 'document', NEW.id,
      jsonb_build_object('doc_type', NEW.doc_type, 'title', NEW.title, 'package_id', NEW.package_id), 'info');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
      VALUES (NEW.user_id, 
        CASE 
          WHEN NEW.status = 'completed' THEN 'document_generated'
          WHEN NEW.status = 'error' THEN 'document_failed'
          WHEN NEW.status = 'generating' THEN 'document_generating'
          ELSE 'document_status_changed'
        END,
        'document', NEW.id,
        jsonb_build_object('doc_type', NEW.doc_type, 'title', NEW.title, 'old_status', OLD.status, 'new_status', NEW.status),
        CASE 
          WHEN NEW.status = 'completed' THEN 'success'
          WHEN NEW.status = 'error' THEN 'error'
          ELSE 'info'
        END);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_documents
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_document_changes();

-- Trigger function for clients
CREATE OR REPLACE FUNCTION public.audit_client_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (NEW.user_id, 'client_created', 'client', NEW.id,
      jsonb_build_object('name', NEW.name, 'nicho', NEW.nicho), 'success');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (NEW.user_id, 'client_updated', 'client', NEW.id,
      jsonb_build_object('name', NEW.name), 'info');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (OLD.user_id, 'client_deleted', 'client', OLD.id,
      jsonb_build_object('name', OLD.name), 'warning');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_client_changes();

-- Trigger function for user roles
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (NEW.user_id, 'role_assigned', 'user_role', NEW.id,
      jsonb_build_object('role', NEW.role), 'warning');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (OLD.user_id, 'role_removed', 'user_role', OLD.id,
      jsonb_build_object('role', OLD.role), 'warning');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_roles
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- Admin function to read audit logs with user info
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(_limit int DEFAULT 200, _offset int DEFAULT 0, _entity_type text DEFAULT NULL, _status text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  action text,
  entity_type text,
  entity_id uuid,
  details jsonb,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    al.id, al.user_id,
    au.email::text AS user_email,
    p.display_name AS user_name,
    al.action, al.entity_type, al.entity_id,
    al.details, al.status, al.created_at
  FROM public.audit_logs al
  LEFT JOIN auth.users au ON au.id = al.user_id
  LEFT JOIN public.profiles p ON p.user_id = al.user_id
  WHERE (_entity_type IS NULL OR al.entity_type = _entity_type)
    AND (_status IS NULL OR al.status = _status)
  ORDER BY al.created_at DESC
  LIMIT _limit OFFSET _offset;
END;
$$;
