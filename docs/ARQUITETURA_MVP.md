# Arquitetura do MVP — AcheiNoVale

## Decisão de produto

O primeiro lançamento valida somente duas jornadas em Rio do Sul:

1. Encontrar, visualizar, publicar e contatar o anunciante de um imóvel.
2. Encontrar, avaliar e pedir orçamento a um freteiro.

Pedido público de frete, cobrança, chat interno e outras categorias ficam fora do MVP. A pergunta de corte é: **isso ajuda a validar imóveis ou freteiros em Rio do Sul?**

## Stack

- Next.js 16 com App Router, TypeScript e páginas públicas renderizadas no servidor.
- CSS responsivo e design mobile-first; PWA pode ser ativada após a validação da navegação.
- Supabase Postgres como banco e Supabase Storage para imagens.
- Prisma para modelo, migrations e acesso tipado ao banco.
- Auth.js com Google e credenciais; uma conta pode anunciar imóveis e manter um perfil de freteiro.
- Vercel para aplicação, previews e cron de tarefas leves.

## Organização funcional

| Domínio | Responsabilidade no MVP |
|---|---|
| Catálogo | Home, listagens, filtros, SEO local e detalhes públicos |
| Imóveis | Publicação em etapas, edição, fotos, favoritos e WhatsApp |
| Freteiros | Perfil profissional, serviços, região, fotos, avaliações e WhatsApp |
| Confiança | Denúncias, moderação, bloqueio, limites e logs administrativos |
| Identidade | Login, perfil único e permissões simples |
| Administração | Fila de denúncias, anúncios, usuários, cidades e bairros |

## Rotas do lançamento

- `/` — home de Rio do Sul.
- `/rio-do-sul/imoveis` — listagem e filtros.
- `/rio-do-sul/imoveis/aluguel` e `/venda` — páginas indexáveis.
- `/rio-do-sul/casas-para-alugar` e variações relevantes — landing pages de SEO.
- `/imovel/[slug]` — detalhe do imóvel e conversão por WhatsApp.
- `/rio-do-sul/freteiros` — listagem e filtros.
- `/freteiro/[slug]` — perfil e pedido de orçamento por WhatsApp.
- `/publicar/imovel` e `/publicar/freteiro` — fluxos autenticados.
- `/favoritos`, `/perfil` e `/painel` — área autenticada.
- `/admin` — administração com papel validado no banco a cada ação sensível.

## Expansão regional sem refazer o sistema

Cidade e bairro são dados, não código. Todas as entidades pesquisáveis possuem `cityId`; imóveis também possuem `neighborhoodId`. O slug da cidade dirige URLs, filtros e metadados. Ativar Lontras ou Ibirama no futuro exige cadastrar cidade/bairros e publicar conteúdo, sem duplicar páginas.

## Regras essenciais

- Endereço exato de imóvel nunca aparece publicamente; salvar coordenadas privadas e publicar somente coordenadas aproximadas.
- Telefones são normalizados para E.164 e usados para montar links `wa.me` com origem rastreável.
- Imagens passam por validação de MIME, tamanho, quantidade e remoção de metadados sensíveis.
- Favoritos usam restrição única por usuário e item.
- Uma avaliação por usuário/freteiro, com rate limit e estado de moderação.
- Denúncias entram em fila; reincidência pode ocultar conteúdo automaticamente para revisão.
- Publicações iniciam como `PENDING` e tornam-se `ACTIVE` após verificações básicas.

## Próxima sequência de implementação

1. Listagem e detalhe de imóveis, reaproveitando os cards da home.
2. Publicação de imóvel em etapas e upload de fotos.
3. Listagem, perfil e cadastro de freteiro.
4. Autenticação, favoritos, avaliações e denúncias.
5. Painel administrativo mínimo e telemetria de conversão para WhatsApp.

O principal indicador inicial é o número de contatos úteis iniciados pelo WhatsApp por anúncio/perfil ativo.
