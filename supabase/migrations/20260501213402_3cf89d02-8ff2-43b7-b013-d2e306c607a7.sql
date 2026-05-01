CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento antigo se existir
DO $$ BEGIN
  PERFORM cron.unschedule('finance-due-notifications-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'finance-due-notifications-daily',
  '0 9 * * *',
  $$ SELECT public.generate_due_date_notifications(); $$
);