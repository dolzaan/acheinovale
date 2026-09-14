CREATE TABLE IF NOT EXISTS "metricas_diarias_freteiros" (
  "id" TEXT NOT NULL,
  "id_perfil" TEXT NOT NULL,
  "data" DATE NOT NULL,
  "visualizacoes" INTEGER NOT NULL DEFAULT 0,
  "cliques_whatsapp" INTEGER NOT NULL DEFAULT 0,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "metricas_diarias_freteiros_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "metricas_diarias_freteiros_id_perfil_data_key"
  ON "metricas_diarias_freteiros"("id_perfil", "data");

CREATE INDEX IF NOT EXISTS "metricas_diarias_freteiros_id_perfil_data_idx"
  ON "metricas_diarias_freteiros"("id_perfil", "data");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'metricas_diarias_freteiros_id_perfil_fkey'
  ) THEN
    ALTER TABLE "metricas_diarias_freteiros"
      ADD CONSTRAINT "metricas_diarias_freteiros_id_perfil_fkey"
      FOREIGN KEY ("id_perfil") REFERENCES "perfis_freteiros"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
