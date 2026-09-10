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
