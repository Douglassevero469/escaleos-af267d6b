-- ===== Contas avançado: novos campos =====
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS installment_number integer,
  ADD COLUMN IF NOT EXISTS installment_total integer,
  ADD COLUMN IF NOT EXISTS installment_group_id uuid,
  ADD COLUMN IF NOT EXISTS interest_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fine_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_discount_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partial_paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_amount numeric;

CREATE INDEX IF NOT EXISTS idx_ft_installment_group ON public.finance_transactions(installment_group_id);
CREATE INDEX IF NOT EXISTS idx_ft_due_date ON public.finance_transactions(due_date);

-- Calcula valor devido considerando atraso (juros+multa) ou antecipação (desconto)
CREATE OR REPLACE FUNCTION public.calculate_transaction_due_amount(_tx_id uuid, _ref_date date DEFAULT CURRENT_DATE)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _t public.finance_transactions%ROWTYPE;
  _base numeric;
  _days int;
  _result numeric;
BEGIN
  SELECT * INTO _t FROM public.finance_transactions WHERE id = _tx_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  _base := _t.amount - COALESCE(_t.partial_paid_amount, 0);
  IF _t.status = 'paid' THEN RETURN 0; END IF;
  _days := _ref_date - _t.due_date;
  IF _days > 0 THEN
    -- Atraso: multa fixa + juros pro-rata diários (mensal/30)
    _result := _base + (_base * COALESCE(_t.fine_rate,0)/100) + (_base * COALESCE(_t.interest_rate,0)/100 * _days / 30.0);
  ELSIF _days < 0 AND COALESCE(_t.early_discount_rate,0) > 0 THEN
    _result := _base - (_base * _t.early_discount_rate/100);
  ELSE
    _result := _base;
  END IF;
  RETURN GREATEST(_result, 0);
END;
$$;

-- Cria parcelamento (N parcelas) a partir de uma "intenção"
CREATE OR REPLACE FUNCTION public.create_installments(
  _user_id uuid, _kind text, _description text, _total_amount numeric,
  _first_due date, _installments int, _category_id uuid DEFAULT NULL,
  _notes text DEFAULT '', _tags text[] DEFAULT '{}'::text[]
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _group uuid := gen_random_uuid();
  _per numeric;
  _i int;
  _due date;
BEGIN
  IF _installments < 1 THEN _installments := 1; END IF;
  _per := round(_total_amount::numeric / _installments, 2);
  FOR _i IN 1.._installments LOOP
    _due := (_first_due + ((_i - 1) || ' months')::interval)::date;
    INSERT INTO public.finance_transactions (
      user_id, kind, description, amount, original_amount, due_date, category_id,
      notes, tags, installment_number, installment_total, installment_group_id, status
    ) VALUES (
      _user_id, _kind, _description || ' (' || _i || '/' || _installments || ')',
      _per, _per, _due, _category_id, _notes, _tags, _i, _installments, _group, 'pending'
    );
  END LOOP;
  RETURN _group;
END;
$$;

-- Baixa parcial: marca valor pago parcial; se quitar, status=paid; senão mantém pending
CREATE OR REPLACE FUNCTION public.partial_pay_transaction(_tx_id uuid, _amount numeric, _paid_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _t public.finance_transactions%ROWTYPE;
  _new_paid numeric;
BEGIN
  SELECT * INTO _t FROM public.finance_transactions WHERE id = _tx_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
  _new_paid := COALESCE(_t.partial_paid_amount,0) + COALESCE(_amount,0);
  IF _new_paid >= _t.amount THEN
    UPDATE public.finance_transactions
       SET partial_paid_amount = _t.amount,
           status = 'paid',
           paid_date = COALESCE(_paid_date, CURRENT_DATE),
           updated_at = now()
     WHERE id = _tx_id;
    RETURN jsonb_build_object('status','paid','paid_amount',_t.amount);
  ELSE
    UPDATE public.finance_transactions
       SET partial_paid_amount = _new_paid,
           updated_at = now()
     WHERE id = _tx_id;
    RETURN jsonb_build_object('status','partial','paid_amount',_new_paid,'remaining',_t.amount - _new_paid);
  END IF;
END;
$$;

-- ===== Budgets =====
CREATE TABLE IF NOT EXISTS public.finance_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid,
  reference_month text NOT NULL, -- 'YYYY-MM'
  planned_amount numeric NOT NULL DEFAULT 0,
  alert_threshold integer NOT NULL DEFAULT 80, -- %
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, reference_month)
);

ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view budgets" ON public.finance_budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert budgets" ON public.finance_budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update budgets" ON public.finance_budgets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete budgets" ON public.finance_budgets FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_finance_budgets_updated
BEFORE UPDATE ON public.finance_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Notificações de vencimento =====
CREATE OR REPLACE FUNCTION public.generate_due_date_notifications()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _r record;
  _alert_days int;
  _days int;
  _title text;
  _msg text;
  _type text;
  _count int := 0;
BEGIN
  FOR _r IN
    SELECT t.*, COALESCE(s.default_payment_alert_days, 7) AS alert_days
    FROM public.finance_transactions t
    LEFT JOIN public.finance_settings s ON s.user_id = t.user_id
    WHERE t.status = 'pending'
      AND t.due_date <= CURRENT_DATE + INTERVAL '30 days'
  LOOP
    _alert_days := _r.alert_days;
    _days := _r.due_date - CURRENT_DATE;
    IF _days > _alert_days THEN CONTINUE; END IF;

    -- Evita duplicar no mesmo dia
    IF EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = _r.user_id
        AND link = '/financeiro?tx=' || _r.id::text
        AND created_at::date = CURRENT_DATE
    ) THEN CONTINUE; END IF;

    IF _days < 0 THEN
      _type := 'error';
      _title := 'Conta vencida há ' || abs(_days) || ' dia(s)';
    ELSIF _days = 0 THEN
      _type := 'warning';
      _title := 'Vence hoje';
    ELSE
      _type := 'info';
      _title := 'Vence em ' || _days || ' dia(s)';
    END IF;

    _msg := _r.description || ' • R$ ' || to_char(_r.amount, 'FM999G999G990D00');

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (_r.user_id, _type, _title, _msg, '/financeiro?tx=' || _r.id::text);
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END;
$$;