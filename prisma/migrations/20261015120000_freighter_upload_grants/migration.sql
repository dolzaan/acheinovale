-- Fotos de freteiros passam a exigir a mesma autorização prévia das mídias de imóveis,
-- para que os limites de quantidade e tamanho não possam ser contornados por upload direto.
DROP POLICY IF EXISTS "Users upload marketplace images to their own folder" ON storage.objects;
CREATE POLICY "Users upload marketplace images to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::TEXT)
    AND (storage.foldername(name))[2] = 'properties'
    AND public.acheinovale_has_valid_media_upload_grant(name)
  )
  OR
  (
    bucket_id = 'freighter-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::TEXT)
    AND (storage.foldername(name))[2] = 'freighters'
    AND public.acheinovale_has_valid_media_upload_grant(name)
  )
);
