-- Consentimento para receber novidades por e-mail (lista no Hostinger Reach).
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "novidades_email_aceito_em" TIMESTAMP(3);
