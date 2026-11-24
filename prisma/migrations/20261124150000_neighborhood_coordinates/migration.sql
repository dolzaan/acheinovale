-- Centro aproximado de cada bairro, para o mapa do anúncio.
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "bairros" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(9,6);
ALTER TABLE "bairros" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(9,6);
ALTER TABLE "bairros" ADD COLUMN IF NOT EXISTS "localizado_em" TIMESTAMP(3);
