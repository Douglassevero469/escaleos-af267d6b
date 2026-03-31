
-- demand_boards: allow all authenticated to SELECT
DROP POLICY IF EXISTS "Users can view own boards" ON public.demand_boards;
CREATE POLICY "Authenticated users can view all boards" ON public.demand_boards FOR SELECT TO authenticated USING (true);

-- demand_items
DROP POLICY IF EXISTS "Users can view own items" ON public.demand_items;
CREATE POLICY "Authenticated users can view all items" ON public.demand_items FOR SELECT TO authenticated USING (true);

-- demand_comments
DROP POLICY IF EXISTS "Users can view own comments" ON public.demand_comments;
CREATE POLICY "Authenticated users can view all comments" ON public.demand_comments FOR SELECT TO authenticated USING (true);

-- demand_subtasks
DROP POLICY IF EXISTS "Users can view own subtasks" ON public.demand_subtasks;
CREATE POLICY "Authenticated users can view all subtasks" ON public.demand_subtasks FOR SELECT TO authenticated USING (true);

-- demand_activity_log
DROP POLICY IF EXISTS "Users can view own activity" ON public.demand_activity_log;
CREATE POLICY "Authenticated users can view all activity" ON public.demand_activity_log FOR SELECT TO authenticated USING (true);

-- demand_attachments
DROP POLICY IF EXISTS "Users can view own attachments" ON public.demand_attachments;
CREATE POLICY "Authenticated users can view all attachments" ON public.demand_attachments FOR SELECT TO authenticated USING (true);

-- demand_templates
DROP POLICY IF EXISTS "Users can view own templates" ON public.demand_templates;
CREATE POLICY "Authenticated users can view all templates" ON public.demand_templates FOR SELECT TO authenticated USING (true);

-- crm_pipelines
DROP POLICY IF EXISTS "Users can view own pipelines" ON public.crm_pipelines;
CREATE POLICY "Authenticated users can view all pipelines" ON public.crm_pipelines FOR SELECT TO authenticated USING (true);

-- crm_leads
DROP POLICY IF EXISTS "Users can view own leads" ON public.crm_leads;
CREATE POLICY "Authenticated users can view all leads" ON public.crm_leads FOR SELECT TO authenticated USING (true);

-- crm_activities
DROP POLICY IF EXISTS "Users can view own activities" ON public.crm_activities;
CREATE POLICY "Authenticated users can view all activities" ON public.crm_activities FOR SELECT TO authenticated USING (true);

-- clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Authenticated users can view all clients" ON public.clients FOR SELECT TO authenticated USING (true);

-- briefings
DROP POLICY IF EXISTS "Users can view own briefings" ON public.briefings;
CREATE POLICY "Authenticated users can view all briefings" ON public.briefings FOR SELECT TO authenticated USING (true);

-- templates
DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "Authenticated users can view all templates" ON public.templates FOR SELECT TO authenticated USING (true);

-- packages
DROP POLICY IF EXISTS "Users can view own packages" ON public.packages;
CREATE POLICY "Authenticated users can view all packages" ON public.packages FOR SELECT TO authenticated USING (true);

-- documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Authenticated users can view all documents" ON public.documents FOR SELECT TO authenticated USING (true);

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Authenticated users can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (true);

-- generation_logs
DROP POLICY IF EXISTS "Users can view own logs" ON public.generation_logs;
CREATE POLICY "Authenticated users can view all logs" ON public.generation_logs FOR SELECT TO authenticated USING (true);
