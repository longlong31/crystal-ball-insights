
-- Fix 1: Restrict community bucket uploads to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload community files" ON storage.objects;

CREATE POLICY "Users can upload to their own community folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Fix 2: Add Realtime authorization policies on realtime.messages
-- Only authenticated users may subscribe; restrict to known community topics.
DROP POLICY IF EXISTS "Authenticated users can receive community realtime" ON realtime.messages;

CREATE POLICY "Authenticated users can receive community realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() IN ('community-posts', 'community-comments', 'news-articles')
);
