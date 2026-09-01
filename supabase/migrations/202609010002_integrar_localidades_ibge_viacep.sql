-- Municípios do Alto Vale conforme a API de Localidades do IBGE.
-- O código IBGE permite relacionar com segurança a resposta do ViaCEP à cidade interna.
ALTER TABLE public.cidades
  ADD COLUMN IF NOT EXISTS codigo_ibge varchar(7);

INSERT INTO public.cidades (id, nome, identificador_url, sigla_estado, ativa, codigo_ibge)
VALUES
  ('city_ibge_4200200', 'Agrolândia', 'agrolandia', 'SC', true, '4200200'),
  ('city_ibge_4200309', 'Agronômica', 'agronomica', 'SC', true, '4200309'),
  ('city_ibge_4201802', 'Atalanta', 'atalanta', 'SC', true, '4201802'),
  ('city_ibge_4201901', 'Aurora', 'aurora', 'SC', true, '4201901'),
  ('city_ibge_4202859', 'Braço do Trombudo', 'braco-do-trombudo', 'SC', true, '4202859'),
  ('city_ibge_4204194', 'Chapadão do Lageado', 'chapadao-do-lageado', 'SC', true, '4204194'),
  ('city_ibge_4205100', 'Dona Emma', 'dona-emma', 'SC', true, '4205100'),
  ('city_ibge_4206900', 'Ibirama', 'ibirama', 'SC', true, '4206900'),
  ('city_ibge_4207403', 'Imbuia', 'imbuia', 'SC', true, '4207403'),
  ('city_ibge_4208500', 'Ituporanga', 'ituporanga', 'SC', true, '4208500'),
  ('city_ibge_4209151', 'José Boiteux', 'jose-boiteux', 'SC', true, '4209151'),
  ('city_ibge_4209508', 'Laurentino', 'laurentino', 'SC', true, '4209508'),
  ('city_ibge_4209904', 'Lontras', 'lontras', 'SC', true, '4209904'),
  ('city_ibge_4210852', 'Mirim Doce', 'mirim-doce', 'SC', true, '4210852'),
  ('city_ibge_4212700', 'Petrolândia', 'petrolandia', 'SC', true, '4212700'),
  ('city_ibge_4213708', 'Pouso Redondo', 'pouso-redondo', 'SC', true, '4213708'),
  ('city_ibge_4214003', 'Presidente Getúlio', 'presidente-getulio', 'SC', true, '4214003'),
  ('city_ibge_4214102', 'Presidente Nereu', 'presidente-nereu', 'SC', true, '4214102'),
  ('city_ibge_4214508', 'Rio do Campo', 'rio-do-campo', 'SC', true, '4214508'),
  ('city_ibge_4214607', 'Rio do Oeste', 'rio-do-oeste', 'SC', true, '4214607'),
  ('city_rio_do_sul', 'Rio do Sul', 'rio-do-sul', 'SC', true, '4214805'),
  ('city_ibge_4215307', 'Salete', 'salete', 'SC', true, '4215307'),
  ('city_ibge_4215679', 'Santa Terezinha', 'santa-terezinha', 'SC', true, '4215679'),
  ('city_ibge_4217808', 'Taió', 'taio', 'SC', true, '4217808'),
  ('city_ibge_4218608', 'Trombudo Central', 'trombudo-central', 'SC', true, '4218608'),
  ('city_ibge_4219200', 'Vidal Ramos', 'vidal-ramos', 'SC', true, '4219200'),
  ('city_ibge_4219358', 'Vitor Meireles', 'vitor-meireles', 'SC', true, '4219358'),
  ('city_ibge_4219408', 'Witmarsum', 'witmarsum', 'SC', true, '4219408')
ON CONFLICT (identificador_url) DO UPDATE
SET nome = EXCLUDED.nome,
    sigla_estado = EXCLUDED.sigla_estado,
    ativa = EXCLUDED.ativa,
    codigo_ibge = EXCLUDED.codigo_ibge;

ALTER TABLE public.cidades
  DROP CONSTRAINT IF EXISTS cidades_codigo_ibge_key;

ALTER TABLE public.cidades
  ADD CONSTRAINT cidades_codigo_ibge_key UNIQUE (codigo_ibge);

