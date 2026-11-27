-- Custos e contas opcionais do imóvel.
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "condominio_centavos" INTEGER;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "iptu_anual_centavos" INTEGER;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "taxa_lixo_anual_centavos" INTEGER;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "agua_inclusa" BOOLEAN;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "luz_inclusa" BOOLEAN;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "internet_inclusa" BOOLEAN;
