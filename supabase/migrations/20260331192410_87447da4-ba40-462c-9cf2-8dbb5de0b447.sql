
-- audit_logs: open insert
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- generation_logs: open insert
DROP POLICY IF EXISTS "Users can insert own logs" ON public.generation_logs;
CREATE POLICY "Authenticated can insert logs" ON public.generation_logs FOR INSERT TO authenticated WITH CHECK (true);

-- profiles: open insert, update, and remove duplicate select
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Authenticated can insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Authenticated can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- Already has "Authenticated users can view all profiles" SELECT policy

-- user_roles: open select to all authenticated
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Authenticated can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
