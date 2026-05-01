CREATE TABLE IF NOT EXISTS public.finance_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  goal_type text NOT NULL DEFAULT 'revenue',
  period_type text NOT NULL DEFAULT 'monthly',
  reference_month text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  color text DEFAULT '#7B2FF7',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view goals" ON public.finance_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert goals" ON public.finance_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update goals" ON public.finance_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete goals" ON public.finance_goals FOR DELETE TO authenticated USING (true);

CREATE TRIGGER finance_goals_updated_at
  BEFORE UPDATE ON public.finance_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();