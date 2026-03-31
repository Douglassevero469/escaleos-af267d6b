-- Form events tracking table for analytics
CREATE TABLE public.form_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'view', 'start', 'submit'
  session_id text, -- anonymous session identifier
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast analytics queries
CREATE INDEX idx_form_events_form_id ON public.form_events(form_id);
CREATE INDEX idx_form_events_created_at ON public.form_events(created_at);
CREATE INDEX idx_form_events_type ON public.form_events(event_type);

-- Enable RLS
ALTER TABLE public.form_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (public tracking)
CREATE POLICY "Anyone can insert form events"
ON public.form_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Form owners can view their events
CREATE POLICY "Form owners can view events"
ON public.form_events
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.forms f
  WHERE f.id = form_events.form_id AND f.user_id = auth.uid()
));

-- Enable realtime for live dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_events;