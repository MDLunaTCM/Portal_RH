-- Allow authenticated HR users to upload to the announcements bucket
CREATE POLICY "HR can upload announcement media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcements'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('hr_admin', 'super_admin')
  )
);

-- Allow authenticated users to read (in case bucket isn't fully public)
CREATE POLICY "Authenticated users can read announcement media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'announcements');
