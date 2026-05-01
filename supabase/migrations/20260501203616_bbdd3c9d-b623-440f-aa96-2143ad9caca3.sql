-- Trigger function for finance entity deletions
CREATE OR REPLACE FUNCTION public.audit_finance_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _action text;
  _entity text;
  _details jsonb;
  _actor uuid;
BEGIN
  _actor := COALESCE(auth.uid(), OLD.user_id);

  IF TG_TABLE_NAME = 'finance_recurring_revenues' THEN
    _action := 'finance_revenue_deleted';
    _entity := 'finance_revenue';
    _details := jsonb_build_object(
      'client_name', OLD.client_name,
      'amount', OLD.amount,
      'description', OLD.description,
      'status', OLD.status
    );
  ELSIF TG_TABLE_NAME = 'finance_recurring_expenses' THEN
    _action := 'finance_expense_deleted';
    _entity := 'finance_expense';
    _details := jsonb_build_object(
      'name', OLD.name,
      'vendor', OLD.vendor,
      'amount', OLD.amount,
      'active', OLD.active
    );
  ELSIF TG_TABLE_NAME = 'finance_team_members' THEN
    _action := 'finance_team_deleted';
    _entity := 'finance_team_member';
    _details := jsonb_build_object(
      'name', OLD.name,
      'role', OLD.role,
      'monthly_cost', OLD.monthly_cost,
      'status', OLD.status
    );
  ELSIF TG_TABLE_NAME = 'finance_goals' THEN
    _action := 'finance_goal_deleted';
    _entity := 'finance_goal';
    _details := jsonb_build_object(
      'title', OLD.title,
      'goal_type', OLD.goal_type,
      'period_type', OLD.period_type,
      'reference_month', OLD.reference_month,
      'target_amount', OLD.target_amount
    );
  ELSIF TG_TABLE_NAME = 'finance_transactions' THEN
    _action := 'finance_transaction_deleted';
    _entity := 'finance_transaction';
    _details := jsonb_build_object(
      'description', OLD.description,
      'kind', OLD.kind,
      'amount', OLD.amount,
      'due_date', OLD.due_date,
      'status', OLD.status
    );
  ELSE
    RETURN OLD;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details, status)
  VALUES (_actor, _action, _entity, OLD.id, _details, 'warning');

  RETURN OLD;
END;
$$;

-- Drop existing triggers if any (safe re-run)
DROP TRIGGER IF EXISTS trg_audit_delete_finance_revenues ON public.finance_recurring_revenues;
DROP TRIGGER IF EXISTS trg_audit_delete_finance_expenses ON public.finance_recurring_expenses;
DROP TRIGGER IF EXISTS trg_audit_delete_finance_team ON public.finance_team_members;
DROP TRIGGER IF EXISTS trg_audit_delete_finance_goals ON public.finance_goals;
DROP TRIGGER IF EXISTS trg_audit_delete_finance_tx ON public.finance_transactions;

CREATE TRIGGER trg_audit_delete_finance_revenues
  BEFORE DELETE ON public.finance_recurring_revenues
  FOR EACH ROW EXECUTE FUNCTION public.audit_finance_deletion();

CREATE TRIGGER trg_audit_delete_finance_expenses
  BEFORE DELETE ON public.finance_recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_finance_deletion();

CREATE TRIGGER trg_audit_delete_finance_team
  BEFORE DELETE ON public.finance_team_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_finance_deletion();

CREATE TRIGGER trg_audit_delete_finance_goals
  BEFORE DELETE ON public.finance_goals
  FOR EACH ROW EXECUTE FUNCTION public.audit_finance_deletion();

CREATE TRIGGER trg_audit_delete_finance_tx
  BEFORE DELETE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_finance_deletion();