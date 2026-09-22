-- Garante uma opção inicial nas cidades atendidas que usam CEP geral.
INSERT INTO "bairros" ("id", "nome", "identificador_url", "id_cidade", "precisa_revisao")
SELECT
  'bairro_base_' || substr(md5(c."id" || ':centro'), 1, 24),
  'Centro',
  'centro',
  c."id",
  false
FROM "cidades" c
WHERE c."ativa" = true
ON CONFLICT ("id_cidade", "identificador_url") DO UPDATE
SET "nome" = EXCLUDED."nome", "precisa_revisao" = false;

-- Catálogo postal inicial. Bairros não cobertos pelo CEP podem ser informados
-- pelo anunciante e entram na fila de revisão do administrador.
WITH catalogo("cidade", "nome", "identificador_url") AS (
  VALUES
    ('rio-do-sul', 'Albertina', 'albertina'),
    ('rio-do-sul', 'Área Rural de Rio do Sul', 'area-rural-de-rio-do-sul'),
    ('rio-do-sul', 'Barra do Trombudo', 'barra-do-trombudo'),
    ('rio-do-sul', 'Barra Itoupava', 'barra-itoupava'),
    ('rio-do-sul', 'Barragem', 'barragem'),
    ('rio-do-sul', 'Bela Aliança', 'bela-alianca'),
    ('rio-do-sul', 'Boa Vista', 'boa-vista'),
    ('rio-do-sul', 'Bremer', 'bremer'),
    ('rio-do-sul', 'Budag', 'budag'),
    ('rio-do-sul', 'Canoas', 'canoas'),
    ('rio-do-sul', 'Canta Galo', 'canta-galo'),
    ('rio-do-sul', 'Centro', 'centro'),
    ('rio-do-sul', 'Eugênio Schneider', 'eugenio-schneider'),
    ('rio-do-sul', 'Fundo Canoas', 'fundo-canoas'),
    ('rio-do-sul', 'Jardim América', 'jardim-america'),
    ('rio-do-sul', 'Laranjeiras', 'laranjeiras'),
    ('rio-do-sul', 'Navegantes', 'navegantes'),
    ('rio-do-sul', 'Pamplona', 'pamplona'),
    ('rio-do-sul', 'Progresso', 'progresso'),
    ('rio-do-sul', 'Rainha', 'rainha'),
    ('rio-do-sul', 'Santa Rita', 'santa-rita'),
    ('rio-do-sul', 'Santana', 'santana'),
    ('rio-do-sul', 'Sumaré', 'sumare'),
    ('rio-do-sul', 'Taboão', 'taboao'),
    ('rio-do-sul', 'Valada Itoupava', 'valada-itoupava'),
    ('rio-do-sul', 'Valada São Paulo', 'valada-sao-paulo'),
    ('ibirama', 'Distrito de Dalbérgia', 'distrito-de-dalbergia'),
    ('taio', 'Distrito de Passo Manso', 'distrito-de-passo-manso')
)
INSERT INTO "bairros" ("id", "nome", "identificador_url", "id_cidade", "precisa_revisao")
SELECT
  'bairro_base_' || substr(md5(c."id" || ':' || catalogo."identificador_url"), 1, 24),
  catalogo."nome",
  catalogo."identificador_url",
  c."id",
  false
FROM catalogo
JOIN "cidades" c ON c."identificador_url" = catalogo."cidade"
ON CONFLICT ("id_cidade", "identificador_url") DO UPDATE
SET "nome" = EXCLUDED."nome", "precisa_revisao" = false;
