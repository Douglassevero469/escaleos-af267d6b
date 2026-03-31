
ALTER TABLE public.crm_leads 
ADD COLUMN next_action_type text DEFAULT NULL,
ADD COLUMN next_action_date timestamp with time zone DEFAULT NULL,
ADD COLUMN next_action_notes text DEFAULT NULL;
