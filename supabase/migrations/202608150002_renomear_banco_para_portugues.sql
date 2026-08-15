-- Renomeia o esquema físico para português sem alterar a API interna do Prisma.
-- As views ao final mantêm a versão anterior do aplicativo funcionando durante o deploy.

-- Tipos
ALTER TYPE public."ContentStatus" RENAME TO status_conteudo;
ALTER TYPE public."PropertyPurpose" RENAME TO finalidade_imovel;
ALTER TYPE public."PropertyType" RENAME TO tipo_imovel;
ALTER TYPE public."ReportStatus" RENAME TO status_denuncia;
ALTER TYPE public."UserRole" RENAME TO funcao_usuario;

-- Tabelas
ALTER TABLE public."User" RENAME TO usuarios;
ALTER TABLE public."City" RENAME TO cidades;
ALTER TABLE public."Neighborhood" RENAME TO bairros;
ALTER TABLE public."Property" RENAME TO imoveis;
ALTER TABLE public."PropertyImage" RENAME TO imagens_imoveis;
ALTER TABLE public."PropertyVideo" RENAME TO videos_imoveis;
ALTER TABLE public."FreighterProfile" RENAME TO perfis_freteiros;
ALTER TABLE public."FreighterService" RENAME TO servicos_freteiros;
ALTER TABLE public."FreighterImage" RENAME TO imagens_freteiros;
ALTER TABLE public."Review" RENAME TO avaliacoes;
ALTER TABLE public."Favorite" RENAME TO favoritos;
ALTER TABLE public."Report" RENAME TO denuncias;

-- Usuários
ALTER TABLE public.usuarios RENAME COLUMN "authUserId" TO id_usuario_auth;
ALTER TABLE public.usuarios RENAME COLUMN "authProvider" TO provedor_autenticacao;
ALTER TABLE public.usuarios RENAME COLUMN "providerId" TO id_provedor;
ALTER TABLE public.usuarios RENAME COLUMN "emailVerifiedAt" TO email_verificado_em;
ALTER TABLE public.usuarios RENAME COLUMN name TO nome;
ALTER TABLE public.usuarios RENAME COLUMN image TO imagem;
ALTER TABLE public.usuarios RENAME COLUMN phone TO telefone;
ALTER TABLE public.usuarios RENAME COLUMN "cityId" TO id_cidade;
ALTER TABLE public.usuarios RENAME COLUMN role TO funcao;
ALTER TABLE public.usuarios RENAME COLUMN "isBlocked" TO bloqueado;
ALTER TABLE public.usuarios RENAME COLUMN "lastLoginAt" TO ultimo_login_em;
ALTER TABLE public.usuarios RENAME COLUMN "createdAt" TO criado_em;
ALTER TABLE public.usuarios RENAME COLUMN "updatedAt" TO atualizado_em;

-- Cidades e bairros
ALTER TABLE public.cidades RENAME COLUMN name TO nome;
ALTER TABLE public.cidades RENAME COLUMN slug TO identificador_url;
ALTER TABLE public.cidades RENAME COLUMN "stateCode" TO sigla_estado;
ALTER TABLE public.cidades RENAME COLUMN "isActive" TO ativa;

ALTER TABLE public.bairros RENAME COLUMN name TO nome;
ALTER TABLE public.bairros RENAME COLUMN slug TO identificador_url;
ALTER TABLE public.bairros RENAME COLUMN "cityId" TO id_cidade;

-- Imóveis e mídias
ALTER TABLE public.imoveis RENAME COLUMN "publicCode" TO codigo_publico;
ALTER TABLE public.imoveis RENAME COLUMN slug TO identificador_url;
ALTER TABLE public.imoveis RENAME COLUMN "ownerId" TO id_proprietario;
ALTER TABLE public.imoveis RENAME COLUMN "cityId" TO id_cidade;
ALTER TABLE public.imoveis RENAME COLUMN "neighborhoodId" TO id_bairro;
ALTER TABLE public.imoveis RENAME COLUMN purpose TO finalidade;
ALTER TABLE public.imoveis RENAME COLUMN type TO tipo;
ALTER TABLE public.imoveis RENAME COLUMN title TO titulo;
ALTER TABLE public.imoveis RENAME COLUMN description TO descricao;
ALTER TABLE public.imoveis RENAME COLUMN "priceCents" TO preco_centavos;
ALTER TABLE public.imoveis RENAME COLUMN bedrooms TO quartos;
ALTER TABLE public.imoveis RENAME COLUMN bathrooms TO banheiros;
ALTER TABLE public.imoveis RENAME COLUMN "parkingSpots" TO vagas_garagem;
ALTER TABLE public.imoveis RENAME COLUMN "areaM2" TO area_m2;
ALTER TABLE public.imoveis RENAME COLUMN "acceptsPets" TO aceita_animais;
ALTER TABLE public.imoveis RENAME COLUMN furnished TO mobiliado;
ALTER TABLE public.imoveis RENAME COLUMN "approximateLat" TO latitude_aproximada;
ALTER TABLE public.imoveis RENAME COLUMN "approximateLng" TO longitude_aproximada;
ALTER TABLE public.imoveis RENAME COLUMN "privateAddressData" TO dados_endereco_privado;
ALTER TABLE public.imoveis RENAME COLUMN "publishedAt" TO publicado_em;
ALTER TABLE public.imoveis RENAME COLUMN "moderationNote" TO observacao_moderacao;
ALTER TABLE public.imoveis RENAME COLUMN "moderatedAt" TO moderado_em;
ALTER TABLE public.imoveis RENAME COLUMN "moderatedById" TO id_moderador;
ALTER TABLE public.imoveis RENAME COLUMN "createdAt" TO criado_em;
ALTER TABLE public.imoveis RENAME COLUMN "updatedAt" TO atualizado_em;

ALTER TABLE public.imagens_imoveis RENAME COLUMN "propertyId" TO id_imovel;
ALTER TABLE public.imagens_imoveis RENAME COLUMN "storageKey" TO chave_armazenamento;
ALTER TABLE public.imagens_imoveis RENAME COLUMN "altText" TO texto_alternativo;
ALTER TABLE public.imagens_imoveis RENAME COLUMN position TO posicao;

ALTER TABLE public.videos_imoveis RENAME COLUMN "propertyId" TO id_imovel;
ALTER TABLE public.videos_imoveis RENAME COLUMN "storageKey" TO chave_armazenamento;
ALTER TABLE public.videos_imoveis RENAME COLUMN "mimeType" TO tipo_mime;
ALTER TABLE public.videos_imoveis RENAME COLUMN position TO posicao;

-- Freteiros
ALTER TABLE public.perfis_freteiros RENAME COLUMN "publicCode" TO codigo_publico;
ALTER TABLE public.perfis_freteiros RENAME COLUMN slug TO identificador_url;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "userId" TO id_usuario;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "cityId" TO id_cidade;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "displayName" TO nome_exibicao;
ALTER TABLE public.perfis_freteiros RENAME COLUMN description TO descricao;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "serviceRadiusKm" TO raio_servico_km;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "availableToday" TO disponivel_hoje;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "priceNote" TO observacao_preco;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "publishedAt" TO publicado_em;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "moderationNote" TO observacao_moderacao;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "moderatedAt" TO moderado_em;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "moderatedById" TO id_moderador;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "createdAt" TO criado_em;
ALTER TABLE public.perfis_freteiros RENAME COLUMN "updatedAt" TO atualizado_em;

ALTER TABLE public.servicos_freteiros RENAME COLUMN "profileId" TO id_perfil;
ALTER TABLE public.servicos_freteiros RENAME COLUMN name TO nome;
ALTER TABLE public.servicos_freteiros RENAME COLUMN slug TO identificador_url;

ALTER TABLE public.imagens_freteiros RENAME COLUMN "profileId" TO id_perfil;
ALTER TABLE public.imagens_freteiros RENAME COLUMN "storageKey" TO chave_armazenamento;
ALTER TABLE public.imagens_freteiros RENAME COLUMN "altText" TO texto_alternativo;
ALTER TABLE public.imagens_freteiros RENAME COLUMN position TO posicao;

-- Avaliações, favoritos e denúncias
ALTER TABLE public.avaliacoes RENAME COLUMN "authorId" TO id_autor;
ALTER TABLE public.avaliacoes RENAME COLUMN "profileId" TO id_perfil_freteiro;
ALTER TABLE public.avaliacoes RENAME COLUMN rating TO nota;
ALTER TABLE public.avaliacoes RENAME COLUMN comment TO comentario;
ALTER TABLE public.avaliacoes RENAME COLUMN "isVisible" TO visivel;
ALTER TABLE public.avaliacoes RENAME COLUMN "createdAt" TO criado_em;
ALTER TABLE public.avaliacoes RENAME COLUMN "updatedAt" TO atualizado_em;

ALTER TABLE public.favoritos RENAME COLUMN "userId" TO id_usuario;
ALTER TABLE public.favoritos RENAME COLUMN "propertyId" TO id_imovel;
ALTER TABLE public.favoritos RENAME COLUMN "freighterProfileId" TO id_perfil_freteiro;
ALTER TABLE public.favoritos RENAME COLUMN "createdAt" TO criado_em;

ALTER TABLE public.denuncias RENAME COLUMN "reporterId" TO id_denunciante;
ALTER TABLE public.denuncias RENAME COLUMN "propertyId" TO id_imovel;
ALTER TABLE public.denuncias RENAME COLUMN "freighterProfileId" TO id_perfil_freteiro;
ALTER TABLE public.denuncias RENAME COLUMN reason TO motivo;
ALTER TABLE public.denuncias RENAME COLUMN details TO detalhes;
ALTER TABLE public.denuncias RENAME COLUMN "createdAt" TO criado_em;
ALTER TABLE public.denuncias RENAME COLUMN "updatedAt" TO atualizado_em;

-- Restrições
ALTER TABLE public.usuarios RENAME CONSTRAINT "User_pkey" TO usuarios_pkey;
ALTER TABLE public.usuarios RENAME CONSTRAINT "User_cityId_fkey" TO usuarios_id_cidade_fkey;
ALTER TABLE public.cidades RENAME CONSTRAINT "City_pkey" TO cidades_pkey;
ALTER TABLE public.bairros RENAME CONSTRAINT "Neighborhood_pkey" TO bairros_pkey;
ALTER TABLE public.bairros RENAME CONSTRAINT "Neighborhood_cityId_fkey" TO bairros_id_cidade_fkey;
ALTER TABLE public.imoveis RENAME CONSTRAINT "Property_pkey" TO imoveis_pkey;
ALTER TABLE public.imoveis RENAME CONSTRAINT "Property_ownerId_fkey" TO imoveis_id_proprietario_fkey;
ALTER TABLE public.imoveis RENAME CONSTRAINT "Property_cityId_fkey" TO imoveis_id_cidade_fkey;
ALTER TABLE public.imoveis RENAME CONSTRAINT "Property_neighborhoodId_fkey" TO imoveis_id_bairro_fkey;
ALTER TABLE public.imoveis RENAME CONSTRAINT "Property_moderatedById_fkey" TO imoveis_id_moderador_fkey;
ALTER TABLE public.imagens_imoveis RENAME CONSTRAINT "PropertyImage_pkey" TO imagens_imoveis_pkey;
ALTER TABLE public.imagens_imoveis RENAME CONSTRAINT "PropertyImage_propertyId_fkey" TO imagens_imoveis_id_imovel_fkey;
ALTER TABLE public.videos_imoveis RENAME CONSTRAINT "PropertyVideo_pkey" TO videos_imoveis_pkey;
ALTER TABLE public.videos_imoveis RENAME CONSTRAINT "PropertyVideo_propertyId_fkey" TO videos_imoveis_id_imovel_fkey;
ALTER TABLE public.perfis_freteiros RENAME CONSTRAINT "FreighterProfile_pkey" TO perfis_freteiros_pkey;
ALTER TABLE public.perfis_freteiros RENAME CONSTRAINT "FreighterProfile_userId_fkey" TO perfis_freteiros_id_usuario_fkey;
ALTER TABLE public.perfis_freteiros RENAME CONSTRAINT "FreighterProfile_cityId_fkey" TO perfis_freteiros_id_cidade_fkey;
ALTER TABLE public.perfis_freteiros RENAME CONSTRAINT "FreighterProfile_moderatedById_fkey" TO perfis_freteiros_id_moderador_fkey;
ALTER TABLE public.servicos_freteiros RENAME CONSTRAINT "FreighterService_pkey" TO servicos_freteiros_pkey;
ALTER TABLE public.servicos_freteiros RENAME CONSTRAINT "FreighterService_profileId_fkey" TO servicos_freteiros_id_perfil_fkey;
ALTER TABLE public.imagens_freteiros RENAME CONSTRAINT "FreighterImage_pkey" TO imagens_freteiros_pkey;
ALTER TABLE public.imagens_freteiros RENAME CONSTRAINT "FreighterImage_profileId_fkey" TO imagens_freteiros_id_perfil_fkey;
ALTER TABLE public.avaliacoes RENAME CONSTRAINT "Review_pkey" TO avaliacoes_pkey;
ALTER TABLE public.avaliacoes RENAME CONSTRAINT "Review_authorId_fkey" TO avaliacoes_id_autor_fkey;
ALTER TABLE public.avaliacoes RENAME CONSTRAINT "Review_profileId_fkey" TO avaliacoes_id_perfil_freteiro_fkey;
ALTER TABLE public.favoritos RENAME CONSTRAINT "Favorite_pkey" TO favoritos_pkey;
ALTER TABLE public.favoritos RENAME CONSTRAINT "Favorite_userId_fkey" TO favoritos_id_usuario_fkey;
ALTER TABLE public.favoritos RENAME CONSTRAINT "Favorite_propertyId_fkey" TO favoritos_id_imovel_fkey;
ALTER TABLE public.favoritos RENAME CONSTRAINT "Favorite_freighterProfileId_fkey" TO favoritos_id_perfil_freteiro_fkey;
ALTER TABLE public.denuncias RENAME CONSTRAINT "Report_pkey" TO denuncias_pkey;
ALTER TABLE public.denuncias RENAME CONSTRAINT "Report_reporterId_fkey" TO denuncias_id_denunciante_fkey;
ALTER TABLE public.denuncias RENAME CONSTRAINT "Report_propertyId_fkey" TO denuncias_id_imovel_fkey;
ALTER TABLE public.denuncias RENAME CONSTRAINT "Report_freighterProfileId_fkey" TO denuncias_id_perfil_freteiro_fkey;

-- Índices
ALTER INDEX public."User_authUserId_key" RENAME TO usuarios_id_usuario_auth_key;
ALTER INDEX public."User_authProvider_providerId_key" RENAME TO usuarios_provedor_autenticacao_id_provedor_key;
ALTER INDEX public."User_cityId_idx" RENAME TO usuarios_id_cidade_idx;
ALTER INDEX public."User_email_key" RENAME TO usuarios_email_key;
ALTER INDEX public."City_slug_key" RENAME TO cidades_identificador_url_key;
ALTER INDEX public."City_isActive_idx" RENAME TO cidades_ativa_idx;
ALTER INDEX public."Neighborhood_cityId_slug_key" RENAME TO bairros_id_cidade_identificador_url_key;
ALTER INDEX public."Property_publicCode_key" RENAME TO imoveis_codigo_publico_key;
ALTER INDEX public."Property_cityId_status_purpose_createdAt_idx" RENAME TO imoveis_id_cidade_status_finalidade_criado_em_idx;
ALTER INDEX public."Property_neighborhoodId_type_priceCents_idx" RENAME TO imoveis_id_bairro_tipo_preco_centavos_idx;
ALTER INDEX public."Property_status_createdAt_idx" RENAME TO imoveis_status_criado_em_idx;
ALTER INDEX public."Property_moderatedById_idx" RENAME TO imoveis_id_moderador_idx;
ALTER INDEX public."Property_slug_idx" RENAME TO imoveis_identificador_url_idx;
ALTER INDEX public."PropertyImage_storageKey_key" RENAME TO imagens_imoveis_chave_armazenamento_key;
ALTER INDEX public."PropertyImage_propertyId_position_idx" RENAME TO imagens_imoveis_id_imovel_posicao_idx;
ALTER INDEX public."PropertyVideo_storageKey_key" RENAME TO videos_imoveis_chave_armazenamento_key;
ALTER INDEX public."PropertyVideo_propertyId_position_idx" RENAME TO videos_imoveis_id_imovel_posicao_idx;
ALTER INDEX public."FreighterProfile_publicCode_key" RENAME TO perfis_freteiros_codigo_publico_key;
ALTER INDEX public."FreighterProfile_userId_key" RENAME TO perfis_freteiros_id_usuario_key;
ALTER INDEX public."FreighterProfile_cityId_status_availableToday_idx" RENAME TO perfis_freteiros_id_cidade_status_disponivel_hoje_idx;
ALTER INDEX public."FreighterProfile_status_createdAt_idx" RENAME TO perfis_freteiros_status_criado_em_idx;
ALTER INDEX public."FreighterProfile_moderatedById_idx" RENAME TO perfis_freteiros_id_moderador_idx;
ALTER INDEX public."FreighterProfile_slug_idx" RENAME TO perfis_freteiros_identificador_url_idx;
ALTER INDEX public."FreighterService_profileId_slug_key" RENAME TO servicos_freteiros_id_perfil_identificador_url_key;
ALTER INDEX public."FreighterService_slug_idx" RENAME TO servicos_freteiros_identificador_url_idx;
ALTER INDEX public."FreighterImage_profileId_position_idx" RENAME TO imagens_freteiros_id_perfil_posicao_idx;
ALTER INDEX public."Review_authorId_profileId_key" RENAME TO avaliacoes_id_autor_id_perfil_freteiro_key;
ALTER INDEX public."Review_profileId_isVisible_createdAt_idx" RENAME TO avaliacoes_id_perfil_visivel_criado_em_idx;
ALTER INDEX public."Favorite_userId_propertyId_key" RENAME TO favoritos_id_usuario_id_imovel_key;
ALTER INDEX public."Favorite_userId_freighterProfileId_key" RENAME TO favoritos_id_usuario_id_perfil_freteiro_key;
ALTER INDEX public."Report_status_createdAt_idx" RENAME TO denuncias_status_criado_em_idx;

-- A tabela de vídeos passa a seguir a mesma proteção das demais tabelas do app.
ALTER TABLE public.videos_imoveis ENABLE ROW LEVEL SECURITY;

-- Compatibilidade temporária com a versão anterior do Prisma.
CREATE VIEW public."User" WITH (security_invoker = true) AS
SELECT id, id_usuario_auth AS "authUserId", email, email_verificado_em AS "emailVerifiedAt",
       nome AS name, imagem AS image, telefone AS phone, funcao AS role, bloqueado AS "isBlocked",
       ultimo_login_em AS "lastLoginAt", criado_em AS "createdAt", atualizado_em AS "updatedAt",
       provedor_autenticacao AS "authProvider", id_provedor AS "providerId", id_cidade AS "cityId"
FROM public.usuarios;

CREATE VIEW public."City" WITH (security_invoker = true) AS
SELECT id, nome AS name, identificador_url AS slug, sigla_estado AS "stateCode", ativa AS "isActive"
FROM public.cidades;

CREATE VIEW public."Neighborhood" WITH (security_invoker = true) AS
SELECT id, nome AS name, identificador_url AS slug, id_cidade AS "cityId"
FROM public.bairros;

CREATE VIEW public."Property" WITH (security_invoker = true) AS
SELECT id, identificador_url AS slug, id_proprietario AS "ownerId", id_cidade AS "cityId",
       id_bairro AS "neighborhoodId", status, finalidade AS purpose, tipo AS type, titulo AS title,
       descricao AS description, preco_centavos AS "priceCents", quartos AS bedrooms,
       banheiros AS bathrooms, vagas_garagem AS "parkingSpots", area_m2 AS "areaM2",
       aceita_animais AS "acceptsPets", mobiliado AS furnished, whatsapp,
       latitude_aproximada AS "approximateLat", longitude_aproximada AS "approximateLng",
       dados_endereco_privado AS "privateAddressData", publicado_em AS "publishedAt",
       criado_em AS "createdAt", atualizado_em AS "updatedAt", codigo_publico AS "publicCode",
       observacao_moderacao AS "moderationNote", moderado_em AS "moderatedAt",
       id_moderador AS "moderatedById"
FROM public.imoveis;

CREATE VIEW public."PropertyImage" WITH (security_invoker = true) AS
SELECT id, id_imovel AS "propertyId", chave_armazenamento AS "storageKey",
       texto_alternativo AS "altText", posicao AS position
FROM public.imagens_imoveis;

CREATE VIEW public."PropertyVideo" WITH (security_invoker = true) AS
SELECT id, id_imovel AS "propertyId", chave_armazenamento AS "storageKey",
       tipo_mime AS "mimeType", posicao AS position
FROM public.videos_imoveis;

CREATE VIEW public."FreighterProfile" WITH (security_invoker = true) AS
SELECT id, identificador_url AS slug, id_usuario AS "userId", id_cidade AS "cityId", status,
       nome_exibicao AS "displayName", descricao AS description, whatsapp,
       raio_servico_km AS "serviceRadiusKm", disponivel_hoje AS "availableToday",
       observacao_preco AS "priceNote", criado_em AS "createdAt", atualizado_em AS "updatedAt",
       codigo_publico AS "publicCode", publicado_em AS "publishedAt",
       observacao_moderacao AS "moderationNote", moderado_em AS "moderatedAt",
       id_moderador AS "moderatedById"
FROM public.perfis_freteiros;

CREATE VIEW public."FreighterService" WITH (security_invoker = true) AS
SELECT id, id_perfil AS "profileId", nome AS name, identificador_url AS slug
FROM public.servicos_freteiros;

CREATE VIEW public."FreighterImage" WITH (security_invoker = true) AS
SELECT id, id_perfil AS "profileId", chave_armazenamento AS "storageKey",
       texto_alternativo AS "altText", posicao AS position
FROM public.imagens_freteiros;

CREATE VIEW public."Review" WITH (security_invoker = true) AS
SELECT id, id_autor AS "authorId", id_perfil_freteiro AS "profileId", nota AS rating,
       comentario AS comment, visivel AS "isVisible", criado_em AS "createdAt",
       atualizado_em AS "updatedAt"
FROM public.avaliacoes;

CREATE VIEW public."Favorite" WITH (security_invoker = true) AS
SELECT id, id_usuario AS "userId", id_imovel AS "propertyId",
       id_perfil_freteiro AS "freighterProfileId", criado_em AS "createdAt"
FROM public.favoritos;

CREATE VIEW public."Report" WITH (security_invoker = true) AS
SELECT id, id_denunciante AS "reporterId", id_imovel AS "propertyId",
       id_perfil_freteiro AS "freighterProfileId", motivo AS reason, detalhes AS details,
       status, criado_em AS "createdAt", atualizado_em AS "updatedAt"
FROM public.denuncias;
