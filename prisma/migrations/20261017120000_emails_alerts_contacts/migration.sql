-- Lembretes por e-mail, alertas de imóveis e registro de contato com freteiros.
-- Idempotente: o build de produção reaplica este arquivo.
ALTER TABLE "imoveis" ADD COLUMN IF NOT EXISTS "lembrete_disponibilidade_enviado_em" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "contatos_whatsapp_freteiros" (
  "id" TEXT NOT NULL,
  "id_usuario" TEXT NOT NULL,
  "id_perfil" TEXT NOT NULL,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contatos_whatsapp_freteiros_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "contatos_whatsapp_freteiros_id_usuario_id_perfil_key"
  ON "contatos_whatsapp_freteiros"("id_usuario", "id_perfil");
ALTER TABLE "contatos_whatsapp_freteiros" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "alertas_imoveis" (
  "id" TEXT NOT NULL,
  "id_usuario" TEXT NOT NULL,
  "id_cidade" TEXT,
  "id_bairro" TEXT,
  "finalidade" "finalidade_imovel",
  "tipo" "tipo_imovel",
  "preco_minimo_centavos" INTEGER,
  "preco_maximo_centavos" INTEGER,
  "quartos_minimo" INTEGER,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "token_cancelamento" TEXT NOT NULL,
  "ultimo_envio_em" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "alertas_imoveis_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "alertas_imoveis_token_cancelamento_key" ON "alertas_imoveis"("token_cancelamento");
CREATE INDEX IF NOT EXISTS "alertas_imoveis_ativo_idx" ON "alertas_imoveis"("ativo");
CREATE INDEX IF NOT EXISTS "alertas_imoveis_id_usuario_idx" ON "alertas_imoveis"("id_usuario");
ALTER TABLE "alertas_imoveis" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contatos_whatsapp_freteiros_id_usuario_fkey') THEN
    ALTER TABLE "contatos_whatsapp_freteiros" ADD CONSTRAINT "contatos_whatsapp_freteiros_id_usuario_fkey"
      FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contatos_whatsapp_freteiros_id_perfil_fkey') THEN
    ALTER TABLE "contatos_whatsapp_freteiros" ADD CONSTRAINT "contatos_whatsapp_freteiros_id_perfil_fkey"
      FOREIGN KEY ("id_perfil") REFERENCES "perfis_freteiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alertas_imoveis_id_usuario_fkey') THEN
    ALTER TABLE "alertas_imoveis" ADD CONSTRAINT "alertas_imoveis_id_usuario_fkey"
      FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alertas_imoveis_id_cidade_fkey') THEN
    ALTER TABLE "alertas_imoveis" ADD CONSTRAINT "alertas_imoveis_id_cidade_fkey"
      FOREIGN KEY ("id_cidade") REFERENCES "cidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alertas_imoveis_id_bairro_fkey') THEN
    ALTER TABLE "alertas_imoveis" ADD CONSTRAINT "alertas_imoveis_id_bairro_fkey"
      FOREIGN KEY ("id_bairro") REFERENCES "bairros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
