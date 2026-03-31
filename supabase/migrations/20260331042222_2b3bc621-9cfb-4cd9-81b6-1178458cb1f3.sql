
-- Add tags column to form_submissions
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add notes column for editable notes on submissions
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Allow form owners to update submissions (for tags, notes, data edits)
CREATE POLICY "Form owners can update submissions"
ON public.form_submissions
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM forms f WHERE f.id = form_submissions.form_id AND f.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM forms f WHERE f.id = form_submissions.form_id AND f.user_id = auth.uid()));
