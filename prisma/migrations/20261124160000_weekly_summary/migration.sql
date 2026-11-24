-- Resumo semanal por e-mail para anunciantes.
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "resumo_semanal_desativado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "resumo_semanal_enviado_em" TIMESTAMP(3);
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "token_cancelamento_resumo" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_token_cancelamento_resumo_key" ON "usuarios"("token_cancelamento_resumo");
