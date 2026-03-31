-- Create storage bucket for form logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-assets', 'form-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload form assets
CREATE POLICY "Users can upload form assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'form-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Users can update form assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'form-assets');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Users can delete form assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'form-assets');

-- Allow public read access (forms are public)
CREATE POLICY "Public read form assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'form-assets');