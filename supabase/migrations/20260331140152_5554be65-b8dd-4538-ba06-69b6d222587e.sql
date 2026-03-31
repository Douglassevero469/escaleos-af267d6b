
-- Subtasks/checklists table
CREATE TABLE public.demand_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.demand_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subtasks" ON public.demand_subtasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subtasks" ON public.demand_subtasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subtasks" ON public.demand_subtasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subtasks" ON public.demand_subtasks FOR DELETE USING (auth.uid() = user_id);

-- Demand templates table
CREATE TABLE public.demand_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  subtasks jsonb NOT NULL DEFAULT '[]',
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.demand_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.demand_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.demand_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.demand_templates FOR DELETE USING (auth.uid() = user_id);

-- Activity log table
CREATE TABLE public.demand_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.demand_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.demand_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.demand_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attachments table
CREATE TABLE public.demand_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.demand_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT 'file',
  file_size integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments" ON public.demand_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attachments" ON public.demand_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attachments" ON public.demand_attachments FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for demand attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('demand-attachments', 'demand-attachments', true);

CREATE POLICY "Users can upload demand attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'demand-attachments');
CREATE POLICY "Anyone can view demand attachments" ON storage.objects FOR SELECT USING (bucket_id = 'demand-attachments');
CREATE POLICY "Users can delete own demand attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'demand-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
