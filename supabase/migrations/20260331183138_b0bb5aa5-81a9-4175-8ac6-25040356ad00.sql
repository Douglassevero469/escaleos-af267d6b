
CREATE OR REPLACE FUNCTION public.create_crm_lead_from_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _form_owner_id uuid;
  _pipeline_id uuid;
  _lead_name text;
  _lead_email text;
  _lead_phone text;
  _lead_company text;
  _data jsonb;
BEGIN
  -- Get the form owner
  SELECT user_id INTO _form_owner_id FROM public.forms WHERE id = NEW.form_id;
  IF _form_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get or create default pipeline for this user
  SELECT id INTO _pipeline_id FROM public.crm_pipelines WHERE user_id = _form_owner_id ORDER BY created_at LIMIT 1;
  IF _pipeline_id IS NULL THEN
    INSERT INTO public.crm_pipelines (user_id, name)
    VALUES (_form_owner_id, 'Pipeline Principal')
    RETURNING id INTO _pipeline_id;
  END IF;

  _data := NEW.data;

  -- Extract fields by common key names (case-insensitive heuristic)
  SELECT val INTO _lead_name FROM (
    SELECT value::text AS val FROM jsonb_each_text(_data)
    WHERE lower(key) IN ('nome', 'name', 'nome_completo', 'full_name', 'nome completo')
    LIMIT 1
  ) sub;

  SELECT val INTO _lead_email FROM (
    SELECT value::text AS val FROM jsonb_each_text(_data)
    WHERE lower(key) IN ('email', 'e-mail', 'e_mail')
    LIMIT 1
  ) sub;

  SELECT val INTO _lead_phone FROM (
    SELECT value::text AS val FROM jsonb_each_text(_data)
    WHERE lower(key) IN ('telefone', 'phone', 'celular', 'whatsapp', 'tel')
    LIMIT 1
  ) sub;

  SELECT val INTO _lead_company FROM (
    SELECT value::text AS val FROM jsonb_each_text(_data)
    WHERE lower(key) IN ('empresa', 'company', 'companhia', 'organização', 'organization')
    LIMIT 1
  ) sub;

  INSERT INTO public.crm_leads (
    pipeline_id, user_id, form_submission_id, form_id,
    name, email, phone, company, stage, custom_fields
  ) VALUES (
    _pipeline_id, _form_owner_id, NEW.id, NEW.form_id,
    COALESCE(_lead_name, ''), COALESCE(_lead_email, ''), COALESCE(_lead_phone, ''), COALESCE(_lead_company, ''),
    'new', _data
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_form_submission_create_lead
AFTER INSERT ON public.form_submissions
FOR EACH ROW EXECUTE FUNCTION public.create_crm_lead_from_submission();
