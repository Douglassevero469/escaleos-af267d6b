-- Histórico de execuções de geração do fluxo de caixa
CREATE TABLE public.finance_generation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month TEXT NOT NULL, -- 'YYYY-MM'
  trigger TEXT NOT NULL DEFAULT 'manual', -- manual | auto | scheduled
  mode TEXT NOT NULL DEFAULT 'replace', -- replace | append
  status TEXT NOT NULL DEFAULT 'running', -- running | success | error | partial
  revenues_count INT NOT NULL DEFAULT 0,
  expenses_count INT NOT NULL DEFAULT 0,
  payroll_count INT NOT NULL DEFAULT 0,
  total_inserted INT NOT NULL DEFAULT 0,
  total_deleted INT NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  message TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fin_runs_month ON public.finance_generation_runs(month DESC);
CREATE INDEX idx_fin_runs_created ON public.finance_generation_runs(created_at DESC);

ALTER TABLE public.finance_generation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view runs" ON public.finance_generation_runs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert runs" ON public.finance_generation_runs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update runs" ON public.finance_generation_runs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete runs" ON public.finance_generation_runs
  FOR DELETE TO authenticated USING (true);

-- Permitir service_role inserir/atualizar (para edge function)
CREATE POLICY "Service role full access runs" ON public.finance_generation_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
