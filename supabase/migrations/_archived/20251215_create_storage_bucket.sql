-- Create the 'product-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Note: We do NOT need to enable RLS on storage.objects as it is enabled by default in Supabase.
-- Trying to run ALTER TABLE on it causes permission errors.

-- Policy: Anyone can view images (Public Access)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Policy: Authenticated users can upload images
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- Policy: Authenticated users can update their own images
DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
CREATE POLICY "Authenticated Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

-- Policy: Authenticated users can delete images
DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;
CREATE POLICY "Authenticated Deletes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );
