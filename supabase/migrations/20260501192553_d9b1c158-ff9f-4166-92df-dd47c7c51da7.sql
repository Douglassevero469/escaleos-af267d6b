
-- Categories
CREATE TABLE public.finance_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'expense',
  color TEXT DEFAULT '#7B2FF7',
  icon TEXT DEFAULT 'Wallet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view categories" ON public.finance_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert categories" ON public.finance_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update categories" ON public.finance_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete categories" ON public.finance_categories FOR DELETE TO authenticated USING (true);

-- Team members
CREATE TABLE public.finance_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT,
  role TEXT NOT NULL,
  manager_id UUID REFERENCES public.finance_team_members(id) ON DELETE SET NULL,
  compensation_type TEXT NOT NULL DEFAULT 'salary',
  monthly_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view team" ON public.finance_team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert team" ON public.finance_team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update team" ON public.finance_team_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete team" ON public.finance_team_members FOR DELETE TO authenticated USING (true);

CREATE TRIGGER tg_finance_team_updated BEFORE UPDATE ON public.finance_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recurring revenues
CREATE TABLE public.finance_recurring_revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_day INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  linked_contract_id UUID,
  category_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_recurring_revenues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view rev" ON public.finance_recurring_revenues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert rev" ON public.finance_recurring_revenues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update rev" ON public.finance_recurring_revenues FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete rev" ON public.finance_recurring_revenues FOR DELETE TO authenticated USING (true);

CREATE TRIGGER tg_finance_rev_updated BEFORE UPDATE ON public.finance_recurring_revenues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recurring expenses
CREATE TABLE public.finance_recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_day INTEGER DEFAULT 5,
  category_id UUID,
  vendor TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_recurring_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view exp" ON public.finance_recurring_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert exp" ON public.finance_recurring_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update exp" ON public.finance_recurring_expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete exp" ON public.finance_recurring_expenses FOR DELETE TO authenticated USING (true);

CREATE TRIGGER tg_finance_exp_updated BEFORE UPDATE ON public.finance_recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transactions
CREATE TABLE public.finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  category_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT '',
  reference_type TEXT DEFAULT 'manual',
  reference_id UUID,
  attachment_url TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view tx" ON public.finance_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert tx" ON public.finance_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update tx" ON public.finance_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete tx" ON public.finance_transactions FOR DELETE TO authenticated USING (true);

CREATE TRIGGER tg_finance_tx_updated BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_finance_tx_due ON public.finance_transactions(due_date);
CREATE INDEX idx_finance_tx_status ON public.finance_transactions(status);
CREATE INDEX idx_finance_tx_kind ON public.finance_transactions(kind);
