ALTER TABLE public.client_contracts ADD COLUMN IF NOT EXISTS client_name TEXT;
UPDATE public.client_contracts cc
  SET client_name = c.name
  FROM public.clients c
  WHERE cc.client_id = c.id AND cc.client_name IS NULL;
ALTER TABLE public.client_contracts ALTER COLUMN client_id DROP NOT NULL;