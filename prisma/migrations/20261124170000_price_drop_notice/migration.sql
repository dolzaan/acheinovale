-- Aviso de redução de preço para quem favoritou ou tem alerta compatível.
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "preco_aprovado_centavos" INTEGER;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "aviso_reducao_enviado_em" TIMESTAMP(3);
-- Anúncios já no ar partem do preço atual, que é o que o público está vendo.
UPDATE "imoveis" SET "preco_aprovado_centavos" = "preco_centavos"
  WHERE "preco_aprovado_centavos" IS NULL AND "status" = 'ACTIVE';
