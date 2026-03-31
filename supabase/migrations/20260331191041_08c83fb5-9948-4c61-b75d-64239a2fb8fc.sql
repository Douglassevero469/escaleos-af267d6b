
-- Allow all authenticated users to view all forms (not just published or own)
DROP POLICY IF EXISTS "Users can view own forms" ON public.forms;
CREATE POLICY "Authenticated users can view all forms" ON public.forms FOR SELECT TO authenticated USING (true);
