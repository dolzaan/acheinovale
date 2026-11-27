-- Cota de enchente do imóvel, em centímetros (opcional).
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "cota_enchente_cm" INTEGER;
