-- Tabela de permissões de módulos por usuário
CREATE TABLE IF NOT EXISTS public.user_module_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  modules text[] NOT NULL DEFAULT ARRAY[
    'dashboard','briefing','clientes','gestao-clientes','financeiro',
    'templates','forms','demandas','crm','closer-ai','perfil'
  ],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own module access" ON public.user_module_access;
CREATE POLICY "Users can view their own module access"
  ON public.user_module_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage module access" ON public.user_module_access;
CREATE POLICY "Admins can manage module access"
  ON public.user_module_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_user_module_access_updated_at ON public.user_module_access;
CREATE TRIGGER update_user_module_access_updated_at
  BEFORE UPDATE ON public.user_module_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.admin_set_user_modules(_target_user_id uuid, _modules text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  INSERT INTO public.user_module_access (user_id, modules)
  VALUES (_target_user_id, _modules)
  ON CONFLICT (user_id) DO UPDATE
    SET modules = EXCLUDED.modules, updated_at = now();

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
  VALUES (auth.uid(), 'user_modules_updated', 'user_module_access', _target_user_id,
    jsonb_build_object('modules', _modules), 'info');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_modules(_target_user_id uuid DEFAULT NULL)
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _modules text[];
BEGIN
  _uid := COALESCE(_target_user_id, auth.uid());
  IF _uid IS NULL THEN RETURN ARRAY[]::text[]; END IF;

  IF _target_user_id IS NOT NULL AND _target_user_id <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF public.has_role(_uid, 'admin') THEN
    RETURN ARRAY[
      'dashboard','briefing','clientes','gestao-clientes','financeiro',
      'templates','forms','demandas','crm','closer-ai','admin','perfil'
    ];
  END IF;

  SELECT modules INTO _modules FROM public.user_module_access WHERE user_id = _uid;

  IF _modules IS NULL THEN
    RETURN ARRAY[
      'dashboard','briefing','clientes','gestao-clientes','financeiro',
      'templates','forms','demandas','crm','closer-ai','perfil'
    ];
  END IF;

  RETURN _modules;
END;
$$;

-- Drop e recria admin_get_all_users com nova coluna modules
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(user_id uuid, email text, display_name text, avatar_url text,
  created_at timestamp with time zone, last_sign_in_at timestamp with time zone,
  role text, total_packages bigint, total_documents bigint, total_tokens bigint,
  total_words bigint, modules text[])
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
    au.id AS user_id,
    au.email::text,
    p.display_name,
    p.avatar_url,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(ur.role::text, 'user') AS role,
    COALESCE(pkg.cnt, 0) AS total_packages,
    COALESCE(doc.cnt, 0) AS total_documents,
    COALESCE(gl.tokens, 0) AS total_tokens,
    COALESCE(gl.words, 0) AS total_words,
    COALESCE(uma.modules, ARRAY[
      'dashboard','briefing','clientes','gestao-clientes','financeiro',
      'templates','forms','demandas','crm','closer-ai','perfil'
    ]) AS modules
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  LEFT JOIN public.user_module_access uma ON uma.user_id = au.id
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.packages pk WHERE pk.user_id = au.id) pkg ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.documents d WHERE d.user_id = au.id) doc ON true
  LEFT JOIN LATERAL (SELECT COALESCE(SUM(token_estimate), 0) AS tokens, COALESCE(SUM(word_count), 0) AS words FROM public.generation_logs g WHERE g.user_id = au.id) gl ON true
  ORDER BY au.created_at DESC;
END;
$$;