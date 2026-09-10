-- Persistent application rate limits.
CREATE TABLE IF NOT EXISTS "limites_requisicao" (
  "chave" TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL DEFAULT 1,
  "reinicia_em" TIMESTAMPTZ NOT NULL,
  "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "limites_requisicao_pkey" PRIMARY KEY ("chave")
);

CREATE INDEX IF NOT EXISTS "limites_requisicao_reinicia_em_idx"
ON "limites_requisicao"("reinicia_em");

ALTER TABLE "limites_requisicao" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "autorizacoes_upload_midia" (
  "id" TEXT NOT NULL,
  "id_usuario_auth" UUID NOT NULL,
  "chave_armazenamento" TEXT NOT NULL,
  "tipo_mime" TEXT NOT NULL,
  "tamanho_maximo" INTEGER NOT NULL,
  "expira_em" TIMESTAMPTZ NOT NULL,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "autorizacoes_upload_midia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "autorizacoes_upload_midia_chave_key" UNIQUE ("chave_armazenamento")
);

CREATE INDEX IF NOT EXISTS "autorizacoes_upload_midia_usuario_expira_idx"
ON "autorizacoes_upload_midia"("id_usuario_auth", "expira_em");

CREATE INDEX IF NOT EXISTS "autorizacoes_upload_midia_expira_idx"
ON "autorizacoes_upload_midia"("expira_em");

ALTER TABLE "autorizacoes_upload_midia" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.acheinovale_has_valid_media_upload_grant(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."autorizacoes_upload_midia" AS grant_row
    WHERE grant_row."chave_armazenamento" = object_name
      AND grant_row."id_usuario_auth" = auth.uid()
      AND grant_row."expira_em" > CURRENT_TIMESTAMP
  );
$$;

REVOKE ALL ON FUNCTION public.acheinovale_has_valid_media_upload_grant(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acheinovale_has_valid_media_upload_grant(TEXT) TO authenticated;

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
  )
);
