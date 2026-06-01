-- Restrict listing in public buckets to file owner only
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view community files" ON storage.objects;

CREATE POLICY "Users can list their own avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can list their own community files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'community'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);