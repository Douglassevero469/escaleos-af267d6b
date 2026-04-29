-- client_contracts
CREATE TABLE public.client_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_fee NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  renewal_date DATE,
  payment_day INTEGER,
  responsible TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all contracts"
  ON public.client_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contracts"
  ON public.client_contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contracts"
  ON public.client_contracts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete contracts"
  ON public.client_contracts FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_client_contracts_client ON public.client_contracts(client_id);
CREATE INDEX idx_client_contracts_status ON public.client_contracts(status);

CREATE TRIGGER trg_client_contracts_updated_at
  BEFORE UPDATE ON public.client_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- client_services
CREATE TABLE public.client_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.client_contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  scope TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all services"
  ON public.client_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert services"
  ON public.client_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update services"
  ON public.client_services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete services"
  ON public.client_services FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_client_services_contract ON public.client_services(contract_id);