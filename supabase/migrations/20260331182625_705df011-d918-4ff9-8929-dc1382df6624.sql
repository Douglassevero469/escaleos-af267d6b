
-- Table: crm_pipelines
CREATE TABLE public.crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[{"id":"new","name":"Novo Lead","color":"#3b82f6","order":0},{"id":"contacted","name":"Contato Feito","color":"#f59e0b","order":1},{"id":"qualified","name":"Qualificado","color":"#8b5cf6","order":2},{"id":"proposal","name":"Proposta","color":"#ec4899","order":3},{"id":"closed","name":"Fechado","color":"#22c55e","order":4}]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pipelines" ON public.crm_pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipelines" ON public.crm_pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipelines" ON public.crm_pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pipelines" ON public.crm_pipelines FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crm_pipelines_updated_at BEFORE UPDATE ON public.crm_pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: crm_leads
CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES public.crm_pipelines(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_submission_id uuid REFERENCES public.form_submissions(id) ON DELETE SET NULL,
  form_id uuid REFERENCES public.forms(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  company text DEFAULT '',
  stage text NOT NULL DEFAULT 'new',
  position integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  value numeric NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lost_at timestamptz
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own leads" ON public.crm_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON public.crm_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.crm_leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.crm_leads FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: crm_activities
CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'note',
  content text DEFAULT '',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.crm_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.crm_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.crm_activities FOR DELETE USING (auth.uid() = user_id);
