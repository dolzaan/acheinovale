-- Índices usados pelas listagens públicas. Todos são idempotentes porque o
-- build de produção reaplica esta migração antes de cada deploy.
CREATE INDEX IF NOT EXISTS "imoveis_id_cidade_status_publicado_em_criado_em_idx"
  ON "imoveis"("id_cidade", "status", "publicado_em" DESC, "criado_em" DESC);

CREATE INDEX IF NOT EXISTS "imoveis_id_cidade_status_finalidade_publicado_em_criado_em_idx"
  ON "imoveis"("id_cidade", "status", "finalidade", "publicado_em" DESC, "criado_em" DESC);

CREATE INDEX IF NOT EXISTS "perfis_freteiros_id_cidade_status_atualizado_em_idx"
  ON "perfis_freteiros"("id_cidade", "status", "atualizado_em" DESC);

CREATE INDEX IF NOT EXISTS "perfis_freteiros_status_atualizado_em_idx"
  ON "perfis_freteiros"("status", "atualizado_em" DESC);

CREATE INDEX IF NOT EXISTS "servicos_freteiros_identificador_url_id_perfil_idx"
  ON "servicos_freteiros"("identificador_url", "id_perfil");
