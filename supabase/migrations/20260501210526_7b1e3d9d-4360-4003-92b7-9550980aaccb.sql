-- 1. Adicionar role 'socio' ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'socio';

-- 2. Novas colunas em finance_transactions
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurring_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_fin_tx_tags ON public.finance_transactions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_fin_tx_recgroup ON public.finance_transactions(recurring_group_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_approval ON public.finance_transactions(approval_status);

-- 3. Reajuste anual em receitas
ALTER TABLE public.finance_recurring_revenues
  ADD COLUMN IF NOT EXISTS annual_adjustment_index text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS last_adjustment_date date;

-- 4. Tabela de configurações financeiras
CREATE TABLE IF NOT EXISTS public.finance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  approval_threshold numeric NOT NULL DEFAULT 5000,
  approval_enabled boolean NOT NULL DEFAULT true,
  default_payment_alert_days int NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view settings" ON public.finance_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert settings" ON public.finance_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update settings" ON public.finance_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete settings" ON public.finance_settings FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.finance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Trigger de audit para UPDATEs em finance_transactions (mudança crítica de status/valor/aprovação)
CREATE OR REPLACE FUNCTION public.audit_finance_transaction_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _changes jsonb := '{}'::jsonb;
  _action text := 'finance_transaction_updated';
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    _changes := _changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    _changes := _changes || jsonb_build_object('amount', jsonb_build_object('old', OLD.amount, 'new', NEW.amount));
  END IF;
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    _changes := _changes || jsonb_build_object('approval', jsonb_build_object('old', OLD.approval_status, 'new', NEW.approval_status));
    IF NEW.approval_status = 'approved' THEN _action := 'finance_transaction_approved'; END IF;
    IF NEW.approval_status = 'rejected' THEN _action := 'finance_transaction_rejected'; END IF;
  END IF;
  IF OLD.paid_date IS DISTINCT FROM NEW.paid_date THEN
    _changes := _changes || jsonb_build_object('paid_date', jsonb_build_object('old', OLD.paid_date, 'new', NEW.paid_date));
  END IF;

  IF _changes <> '{}'::jsonb THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
    VALUES (
      COALESCE(auth.uid(), NEW.user_id),
      _action,
      'finance_transaction',
      NEW.id,
      jsonb_build_object('description', NEW.description, 'changes', _changes),
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_fin_tx_update ON public.finance_transactions;
CREATE TRIGGER trg_audit_fin_tx_update
  AFTER UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_finance_transaction_update();

-- 6. Função RPC para conciliação em massa (marca várias transações como pagas hoje)
CREATE OR REPLACE FUNCTION public.bulk_mark_transactions_paid(_ids uuid[], _paid_date date DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count int;
BEGIN
  UPDATE public.finance_transactions
  SET status = 'paid',
      paid_date = COALESCE(_paid_date, CURRENT_DATE),
      updated_at = now()
  WHERE id = ANY(_ids);
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- 7. Storage bucket para anexos financeiros
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-attachments', 'finance-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth view finance attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'finance-attachments');

CREATE POLICY "Auth upload finance attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'finance-attachments');

CREATE POLICY "Auth update finance attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'finance-attachments');

CREATE POLICY "Auth delete finance attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'finance-attachments');