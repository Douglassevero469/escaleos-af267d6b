
-- Create forms table
CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  layout text NOT NULL DEFAULT 'list',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create form_submissions table
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Forms RLS: owner only
CREATE POLICY "Users can view own forms" ON public.forms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own forms" ON public.forms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own forms" ON public.forms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own forms" ON public.forms FOR DELETE USING (auth.uid() = user_id);

-- Submissions: anon can insert, owner can select
CREATE POLICY "Anyone can submit forms" ON public.form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Form owners can view submissions" ON public.form_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.user_id = auth.uid())
);
CREATE POLICY "Form owners can delete submissions" ON public.form_submissions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.user_id = auth.uid())
);

-- Updated_at trigger for forms
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for slug lookups
CREATE INDEX idx_forms_slug ON public.forms(slug);
CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
