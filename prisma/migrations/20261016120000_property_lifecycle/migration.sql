-- Confirmação periódica de disponibilidade dos imóveis e métricas diárias por imóvel.
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "disponibilidade_confirmada_em" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "imoveis_status_disponibilidade_idx"
  ON "imoveis"("status", "disponibilidade_confirmada_em", "publicado_em");

CREATE TABLE IF NOT EXISTS "metricas_diarias_imoveis" (
  "id" TEXT NOT NULL,
  "id_imovel" TEXT NOT NULL,
  "data" DATE NOT NULL,
  "visualizacoes" INTEGER NOT NULL DEFAULT 0,
  "cliques_whatsapp" INTEGER NOT NULL DEFAULT 0,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "metricas_diarias_imoveis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "metricas_diarias_imoveis_id_imovel_data_key"
  ON "metricas_diarias_imoveis"("id_imovel", "data");

ALTER TABLE "metricas_diarias_imoveis" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'metricas_diarias_imoveis_id_imovel_fkey'
  ) THEN
    ALTER TABLE "metricas_diarias_imoveis"
      ADD CONSTRAINT "metricas_diarias_imoveis_id_imovel_fkey"
      FOREIGN KEY ("id_imovel") REFERENCES "imoveis"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
