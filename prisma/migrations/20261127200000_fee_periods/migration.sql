-- Período (mês ou ano) escolhido para condomínio, IPTU e taxa de lixo.
-- Vazio = anúncio antigo: condomínio por mês, IPTU e lixo por ano.
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "condominio_periodo" TEXT;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "iptu_periodo" TEXT;
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "taxa_lixo_periodo" TEXT;
