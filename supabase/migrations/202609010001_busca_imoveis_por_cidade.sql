-- Permite que a busca textual seja limitada à cidade escolhida pelo usuário.
-- A assinatura anterior é mantida temporariamente para compatibilidade com deploys antigos.
CREATE OR REPLACE FUNCTION private.buscar_imoveis(
  p_termo text DEFAULT '',
  p_id_cidade text DEFAULT NULL,
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
        ELSE websearch_to_tsquery('simple', private.normalizar_texto_busca(p_termo))
      END AS consulta
  ), base AS (
    SELECT
      i.id,
      i.publicado_em,
      i.criado_em,
      i.preco_centavos,
      private.normalizar_texto_busca(i.codigo_publico) AS codigo_normalizado,
      private.normalizar_texto_busca(i.titulo) AS titulo_normalizado,
      private.normalizar_texto_busca(b.nome) AS bairro_normalizado,
      private.normalizar_texto_busca(b.identificador_url) AS bairro_slug_normalizado,
      i.vetor_busca,
      i.documento_busca,
      p.termo,
      p.consulta,
      (
        p.termo = ''
        OR i.documento_busca LIKE '%' || p.termo || '%'
        OR i.vetor_busca @@ p.consulta
      ) AS correspondencia_forte,
      greatest(
        extensions.similarity(private.normalizar_texto_busca(i.titulo), p.termo),
        extensions.similarity(private.normalizar_texto_busca(b.nome), p.termo),
        extensions.word_similarity(p.termo, i.documento_busca)
      )::double precision AS similaridade
    FROM public.imoveis i
    JOIN public.bairros b ON b.id = i.id_bairro
    JOIN public.cidades c ON c.id = i.id_cidade
    CROSS JOIN parametros p
    WHERE i.status = 'ACTIVE'
      AND c.ativa IS TRUE
      AND (p_id_cidade IS NULL OR i.id_cidade = p_id_cidade)
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
  ), correspondencias AS (
    SELECT
      base.*,
      bool_or(correspondencia_forte) OVER () AS existe_correspondencia_forte
    FROM base
    WHERE correspondencia_forte OR similaridade >= 0.35
  ), candidatos AS (
    SELECT
      id,
      publicado_em,
      criado_em,
      preco_centavos,
      CASE WHEN termo = '' THEN 0::double precision ELSE
        (CASE WHEN codigo_normalizado = termo THEN 100 ELSE 0 END) +
        (CASE WHEN bairro_normalizado = termo OR bairro_slug_normalizado = termo THEN 50 ELSE 0 END) +
        (CASE WHEN titulo_normalizado = termo THEN 40 ELSE 0 END) +
        (CASE WHEN titulo_normalizado LIKE termo || '%' THEN 25 ELSE 0 END) +
        (CASE WHEN titulo_normalizado LIKE '%' || termo || '%' THEN 15 ELSE 0 END) +
        coalesce(ts_rank_cd(vetor_busca, consulta)::double precision * 20, 0) +
        similaridade * 10
      END AS relevancia
    FROM correspondencias
    WHERE correspondencia_forte OR NOT existe_correspondencia_forte
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

REVOKE ALL ON FUNCTION private.buscar_imoveis(
  text, text, text, text, text, integer, integer, integer, integer, integer,
  numeric, boolean, boolean, integer
) FROM PUBLIC;
