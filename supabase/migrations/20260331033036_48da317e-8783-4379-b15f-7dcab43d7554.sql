
-- Security definer function for admins to get all users with stats
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text,
  total_packages bigint,
  total_documents bigint,
  total_tokens bigint,
  total_words bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
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
    COALESCE(gl.words, 0) AS total_words
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.packages pk WHERE pk.user_id = au.id) pkg ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.documents d WHERE d.user_id = au.id) doc ON true
  LEFT JOIN LATERAL (SELECT COALESCE(SUM(token_estimate), 0) AS tokens, COALESCE(SUM(word_count), 0) AS words FROM public.generation_logs g WHERE g.user_id = au.id) gl ON true
  ORDER BY au.created_at DESC;
END;
$$;

-- Function for admin to toggle user role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_target_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Upsert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove other roles
  DELETE FROM public.user_roles 
  WHERE user_id = _target_user_id AND role != _role;
END;
$$;

-- Function for admin to get platform-wide stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS TABLE (
  total_users bigint,
  total_packages bigint,
  total_documents bigint,
  total_tokens bigint,
  generations_today bigint
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
    (SELECT COUNT(*) FROM auth.users),
    (SELECT COUNT(*) FROM public.packages),
    (SELECT COUNT(*) FROM public.documents),
    (SELECT COALESCE(SUM(token_estimate), 0) FROM public.generation_logs),
    (SELECT COUNT(*) FROM public.generation_logs WHERE created_at >= CURRENT_DATE);
END;
$$;
