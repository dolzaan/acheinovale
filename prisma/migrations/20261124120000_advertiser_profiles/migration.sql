-- Perfil público de corretores e imobiliárias.
-- Idempotente: o build de produção reaplica este arquivo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_anunciante') THEN
    CREATE TYPE "tipo_anunciante" AS ENUM ('INDIVIDUAL', 'BROKER', 'AGENCY');
  END IF;
END
$$;

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "tipo_anunciante" "tipo_anunciante" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "nome_comercial" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "creci" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "identificador_perfil" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_identificador_perfil_key" ON "usuarios"("identificador_perfil");
