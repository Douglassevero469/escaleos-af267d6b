-- Allow anyone (anon + authenticated) to read published forms by slug
CREATE POLICY "Anyone can view published forms"
ON public.forms
FOR SELECT
TO anon, authenticated
USING (status = 'published');