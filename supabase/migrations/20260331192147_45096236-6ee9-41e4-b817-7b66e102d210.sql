
-- forms: allow all authenticated to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can insert own forms" ON public.forms;
CREATE POLICY "Authenticated users can insert forms" ON public.forms FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own forms" ON public.forms;
CREATE POLICY "Authenticated users can update forms" ON public.forms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own forms" ON public.forms;
CREATE POLICY "Authenticated users can delete forms" ON public.forms FOR DELETE TO authenticated USING (true);

-- form_submissions: allow all authenticated to view and update
DROP POLICY IF EXISTS "Form owners can view submissions" ON public.form_submissions;
CREATE POLICY "Authenticated users can view all submissions" ON public.form_submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Form owners can update submissions" ON public.form_submissions;
CREATE POLICY "Authenticated users can update submissions" ON public.form_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Form owners can delete submissions" ON public.form_submissions;
CREATE POLICY "Authenticated users can delete submissions" ON public.form_submissions FOR DELETE TO authenticated USING (true);

-- form_events: allow all authenticated to view
DROP POLICY IF EXISTS "Form owners can view events" ON public.form_events;
CREATE POLICY "Authenticated users can view all events" ON public.form_events FOR SELECT TO authenticated USING (true);
