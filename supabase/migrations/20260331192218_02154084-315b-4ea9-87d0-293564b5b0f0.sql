
-- demand_boards
DROP POLICY IF EXISTS "Users can insert own boards" ON public.demand_boards;
CREATE POLICY "Authenticated can insert boards" ON public.demand_boards FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own boards" ON public.demand_boards;
CREATE POLICY "Authenticated can update boards" ON public.demand_boards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own boards" ON public.demand_boards;
CREATE POLICY "Authenticated can delete boards" ON public.demand_boards FOR DELETE TO authenticated USING (true);

-- demand_items
DROP POLICY IF EXISTS "Users can insert own items" ON public.demand_items;
CREATE POLICY "Authenticated can insert items" ON public.demand_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own items" ON public.demand_items;
CREATE POLICY "Authenticated can update items" ON public.demand_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own items" ON public.demand_items;
CREATE POLICY "Authenticated can delete items" ON public.demand_items FOR DELETE TO authenticated USING (true);

-- demand_subtasks
DROP POLICY IF EXISTS "Users can insert own subtasks" ON public.demand_subtasks;
CREATE POLICY "Authenticated can insert subtasks" ON public.demand_subtasks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own subtasks" ON public.demand_subtasks;
CREATE POLICY "Authenticated can update subtasks" ON public.demand_subtasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own subtasks" ON public.demand_subtasks;
CREATE POLICY "Authenticated can delete subtasks" ON public.demand_subtasks FOR DELETE TO authenticated USING (true);

-- demand_comments
DROP POLICY IF EXISTS "Users can insert own comments" ON public.demand_comments;
CREATE POLICY "Authenticated can insert comments" ON public.demand_comments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own comments" ON public.demand_comments;
CREATE POLICY "Authenticated can update comments" ON public.demand_comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.demand_comments;
CREATE POLICY "Authenticated can delete comments" ON public.demand_comments FOR DELETE TO authenticated USING (true);

-- demand_activity_log
DROP POLICY IF EXISTS "Users can insert own activity" ON public.demand_activity_log;
CREATE POLICY "Authenticated can insert activity" ON public.demand_activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- demand_attachments
DROP POLICY IF EXISTS "Users can insert own attachments" ON public.demand_attachments;
CREATE POLICY "Authenticated can insert attachments" ON public.demand_attachments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own attachments" ON public.demand_attachments;
CREATE POLICY "Authenticated can delete attachments" ON public.demand_attachments FOR DELETE TO authenticated USING (true);

-- demand_templates
DROP POLICY IF EXISTS "Users can insert own templates" ON public.demand_templates;
CREATE POLICY "Authenticated can insert templates" ON public.demand_templates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own templates" ON public.demand_templates;
CREATE POLICY "Authenticated can update templates" ON public.demand_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own templates" ON public.demand_templates;
CREATE POLICY "Authenticated can delete templates" ON public.demand_templates FOR DELETE TO authenticated USING (true);

-- crm_pipelines
DROP POLICY IF EXISTS "Users can insert own pipelines" ON public.crm_pipelines;
CREATE POLICY "Authenticated can insert pipelines" ON public.crm_pipelines FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own pipelines" ON public.crm_pipelines;
CREATE POLICY "Authenticated can update pipelines" ON public.crm_pipelines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own pipelines" ON public.crm_pipelines;
CREATE POLICY "Authenticated can delete pipelines" ON public.crm_pipelines FOR DELETE TO authenticated USING (true);

-- crm_leads
DROP POLICY IF EXISTS "Users can insert own leads" ON public.crm_leads;
CREATE POLICY "Authenticated can insert leads" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own leads" ON public.crm_leads;
CREATE POLICY "Authenticated can update leads" ON public.crm_leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own leads" ON public.crm_leads;
CREATE POLICY "Authenticated can delete leads" ON public.crm_leads FOR DELETE TO authenticated USING (true);

-- crm_activities
DROP POLICY IF EXISTS "Users can insert own activities" ON public.crm_activities;
CREATE POLICY "Authenticated can insert activities" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own activities" ON public.crm_activities;
CREATE POLICY "Authenticated can delete activities" ON public.crm_activities FOR DELETE TO authenticated USING (true);

-- clients
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
CREATE POLICY "Authenticated can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Authenticated can update clients" ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
CREATE POLICY "Authenticated can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- briefings
DROP POLICY IF EXISTS "Users can insert own briefings" ON public.briefings;
CREATE POLICY "Authenticated can insert briefings" ON public.briefings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own briefings" ON public.briefings;
CREATE POLICY "Authenticated can update briefings" ON public.briefings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own briefings" ON public.briefings;
CREATE POLICY "Authenticated can delete briefings" ON public.briefings FOR DELETE TO authenticated USING (true);

-- templates
DROP POLICY IF EXISTS "Users can insert own templates" ON public.templates;
CREATE POLICY "Authenticated can insert templates2" ON public.templates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Authenticated can update templates2" ON public.templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Authenticated can delete templates2" ON public.templates FOR DELETE TO authenticated USING (true);

-- packages
DROP POLICY IF EXISTS "Users can insert own packages" ON public.packages;
CREATE POLICY "Authenticated can insert packages" ON public.packages FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own packages" ON public.packages;
CREATE POLICY "Authenticated can update packages" ON public.packages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- documents
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Authenticated can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Authenticated can update documents" ON public.documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- notifications
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Authenticated can update notifications" ON public.notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Authenticated can delete notifications" ON public.notifications FOR DELETE TO authenticated USING (true);
