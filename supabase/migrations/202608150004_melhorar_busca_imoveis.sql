-- Busca de imóveis com relevância, português, normalização de acentos e tolerância a erros.
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.normalizar_texto_busca(valor text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT lower(extensions.unaccent('extensions.unaccent'::regdictionary, valor));
$$;

ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS documento_busca text NOT NULL DEFAULT '';

ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS vetor_busca tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', documento_busca)) STORED;

CREATE OR REPLACE FUNCTION private.preparar_busca_imovel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  nome_bairro text;
  identificador_bairro text;
  nome_cidade text;
BEGIN
  SELECT b.nome, b.identificador_url
    INTO nome_bairro, identificador_bairro
  FROM public.bairros b
  WHERE b.id = NEW.id_bairro;

  SELECT c.nome
    INTO nome_cidade
  FROM public.cidades c
  WHERE c.id = NEW.id_cidade;

  NEW.documento_busca := private.normalizar_texto_busca(concat_ws(' ',
    NEW.codigo_publico,
    NEW.titulo,
    NEW.descricao,
    nome_bairro,
    identificador_bairro,
    nome_cidade,
    CASE NEW.finalidade::text
      WHEN 'RENT' THEN 'aluguel alugar locacao locar arrendar'
      WHEN 'SALE' THEN 'venda vender compra comprar'
      ELSE ''
    END,
    CASE NEW.tipo::text
      WHEN 'HOUSE' THEN 'casa casas sobrado residencia residencial'
      WHEN 'APARTMENT' THEN 'apartamento apartamentos apto'
      WHEN 'STUDIO' THEN 'kitnet quitinete studio estudio'
      WHEN 'LAND' THEN 'terreno terrenos lote lotes'
      WHEN 'COMMERCIAL_ROOM' THEN 'sala comercial imovel comercial comercio'
      WHEN 'WAREHOUSE' THEN 'galpao barracao deposito'
      WHEN 'OTHER' THEN 'outro imovel'
      ELSE ''
    END,
    CASE WHEN NEW.quartos IS NOT NULL
      THEN concat(NEW.quartos, ' quarto quartos dormitorio dormitorios') ELSE '' END,
    CASE WHEN NEW.banheiros IS NOT NULL
      THEN concat(NEW.banheiros, ' banheiro banheiros') ELSE '' END,
    CASE WHEN NEW.vagas_garagem IS NOT NULL
      THEN concat(NEW.vagas_garagem, ' vaga vagas garagem estacionamento') ELSE '' END,
    CASE WHEN NEW.area_m2 IS NOT NULL
      THEN concat(NEW.area_m2, ' m2 metros quadrados area') ELSE '' END,
    CASE WHEN NEW.aceita_animais IS TRUE
      THEN 'aceita pet pets animais cachorro gato' ELSE '' END,
    CASE WHEN NEW.mobiliado IS TRUE
      THEN 'mobiliado mobiliada com moveis' ELSE '' END,
    concat((NEW.preco_centavos / 100), ' reais')
  ));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preparar_busca_imovel ON public.imoveis;
CREATE TRIGGER preparar_busca_imovel
BEFORE INSERT OR UPDATE OF codigo_publico, titulo, descricao, id_bairro, id_cidade,
  finalidade, tipo, quartos, banheiros, vagas_garagem, area_m2, aceita_animais,
  mobiliado, preco_centavos
ON public.imoveis
FOR EACH ROW
EXECUTE FUNCTION private.preparar_busca_imovel();

-- Recalcula documentos existentes usando os dados estruturados atuais.
UPDATE public.imoveis SET titulo = titulo;

CREATE INDEX IF NOT EXISTS imoveis_vetor_busca_idx
  ON public.imoveis USING gin (vetor_busca)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS imoveis_documento_busca_trgm_idx
  ON public.imoveis USING gin (documento_busca extensions.gin_trgm_ops)
  WHERE status = 'ACTIVE';

CREATE OR REPLACE FUNCTION private.reindexar_busca_por_bairro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.imoveis
  SET id_bairro = id_bairro
  WHERE id_bairro = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reindexar_busca_por_bairro ON public.bairros;
CREATE TRIGGER reindexar_busca_por_bairro
AFTER UPDATE OF nome, identificador_url ON public.bairros
FOR EACH ROW
WHEN (OLD.nome IS DISTINCT FROM NEW.nome OR OLD.identificador_url IS DISTINCT FROM NEW.identificador_url)
EXECUTE FUNCTION private.reindexar_busca_por_bairro();

CREATE OR REPLACE FUNCTION private.reindexar_busca_por_cidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.imoveis
  SET id_cidade = id_cidade
  WHERE id_cidade = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reindexar_busca_por_cidade ON public.cidades;
CREATE TRIGGER reindexar_busca_por_cidade
AFTER UPDATE OF nome, identificador_url ON public.cidades
FOR EACH ROW
WHEN (OLD.nome IS DISTINCT FROM NEW.nome OR OLD.identificador_url IS DISTINCT FROM NEW.identificador_url)
EXECUTE FUNCTION private.reindexar_busca_por_cidade();

CREATE OR REPLACE FUNCTION private.buscar_imoveis(
  p_termo text DEFAULT '',
  p_finalidade text DEFAULT NULL,
  p_tipo text DEFAULT NULL,
  p_id_bairro text DEFAULT NULL,
  p_preco_min integer DEFAULT NULL,
  p_preco_max integer DEFAULT NULL,
  p_quartos_min integer DEFAULT NULL,
  p_banheiros_min integer DEFAULT NULL,
  p_vagas_min integer DEFAULT NULL,
  p_area_min numeric DEFAULT NULL,
  p_aceita_animais boolean DEFAULT NULL,
  p_mobiliado boolean DEFAULT NULL,
  p_limite integer DEFAULT 48
)
RETURNS TABLE (id text, relevancia double precision, total_resultados bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH parametros AS (
    SELECT
      private.normalizar_texto_busca(coalesce(p_termo, '')) AS termo,
      CASE
        WHEN trim(coalesce(p_termo, '')) = '' THEN NULL::tsquery
        ELSE websearch_to_tsquery(
          'portuguese',
          private.normalizar_texto_busca(p_termo)
        )
      END AS consulta
  ), candidatos AS (
    SELECT
      i.id,
      i.publicado_em,
      i.criado_em,
      i.preco_centavos,
      CASE WHEN p.termo = '' THEN 0::double precision ELSE
        (CASE WHEN private.normalizar_texto_busca(i.codigo_publico) = p.termo THEN 100 ELSE 0 END) +
        (CASE WHEN private.normalizar_texto_busca(b.nome) = p.termo
                    OR private.normalizar_texto_busca(b.identificador_url) = p.termo
          THEN 50 ELSE 0 END) +
        (CASE WHEN private.normalizar_texto_busca(i.titulo) = p.termo THEN 40 ELSE 0 END) +
        (CASE WHEN private.normalizar_texto_busca(i.titulo) LIKE p.termo || '%' THEN 25 ELSE 0 END) +
        (CASE WHEN private.normalizar_texto_busca(i.titulo) LIKE '%' || p.termo || '%' THEN 15 ELSE 0 END) +
        coalesce(ts_rank_cd(i.vetor_busca, p.consulta)::double precision * 20, 0) +
        greatest(
          extensions.similarity(private.normalizar_texto_busca(i.titulo), p.termo),
          extensions.similarity(private.normalizar_texto_busca(b.nome), p.termo),
          extensions.word_similarity(p.termo, i.documento_busca)
        )::double precision * 10
      END AS relevancia
    FROM public.imoveis i
    JOIN public.bairros b ON b.id = i.id_bairro
    JOIN public.cidades c ON c.id = i.id_cidade
    CROSS JOIN parametros p
    WHERE i.status = 'ACTIVE'
      AND c.ativa IS TRUE
      AND c.identificador_url = 'rio-do-sul'
      AND (p_finalidade IS NULL OR i.finalidade::text = p_finalidade)
      AND (p_tipo IS NULL OR i.tipo::text = p_tipo)
      AND (p_id_bairro IS NULL OR i.id_bairro = p_id_bairro)
      AND (p_preco_min IS NULL OR i.preco_centavos >= p_preco_min)
      AND (p_preco_max IS NULL OR i.preco_centavos <= p_preco_max)
      AND (p_quartos_min IS NULL OR i.quartos >= p_quartos_min)
      AND (p_banheiros_min IS NULL OR i.banheiros >= p_banheiros_min)
      AND (p_vagas_min IS NULL OR i.vagas_garagem >= p_vagas_min)
      AND (p_area_min IS NULL OR i.area_m2 >= p_area_min)
      AND (p_aceita_animais IS NULL OR i.aceita_animais = p_aceita_animais)
      AND (p_mobiliado IS NULL OR i.mobiliado = p_mobiliado)
      AND (
        p.termo = ''
        OR i.vetor_busca @@ p.consulta
        OR i.documento_busca OPERATOR(extensions.%) p.termo
        OR extensions.word_similarity(p.termo, i.documento_busca) >= 0.35
      )
  ), classificados AS (
    SELECT
      candidatos.*,
      count(*) OVER () AS total_resultados
    FROM candidatos
  )
  SELECT id, relevancia, total_resultados
  FROM classificados
  ORDER BY relevancia DESC, publicado_em DESC NULLS LAST, criado_em DESC, id
  LIMIT least(greatest(coalesce(p_limite, 48), 1), 200);
$$;

REVOKE ALL ON FUNCTION private.normalizar_texto_busca(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.preparar_busca_imovel() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.reindexar_busca_por_bairro() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.reindexar_busca_por_cidade() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.buscar_imoveis(
  text, text, text, text, integer, integer, integer, integer, integer,
  numeric, boolean, boolean, integer
) FROM PUBLIC;
