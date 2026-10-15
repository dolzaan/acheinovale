# Plano de evolução — Achei no Vale

Este documento registra a implantação segura das sete melhorias propostas. Não representa funcionalidades já publicadas.

## Etapa 1 — Compartilhamento e contato
PR #56: compartilhamento de anúncios e melhoria visual de contato. Validar links, acessibilidade, tela pequena e fluxo do WhatsApp.

## Etapa 2 — Busca regional
PR #57: validação de cidade e preparação de parâmetro regional. **Pendente:** implementar consulta multi-cidades real no catálogo, seleção explícita "Minha cidade / Toda a região" e testes para evitar resultados incorretos. Não apresentar "toda a região" antes de implementar a consulta.

## Etapa 3 — Verificação de anunciantes
**Pendente:** definir critério verificável (por exemplo, telefone confirmado), registro persistente do status, auditoria e revogação. Não exibir selo até haver verificação efetiva. Nunca representar verificação de telefone como verificação de identidade.

## Etapa 4 — Alertas de novos imóveis
**Pendente:** preferências de cidade, preço e tipo, opt-in explícito, confirmação e cancelamento, prevenção de spam, agendamento e provedor de entrega. Não ativar notificações sem consentimento.

## Etapa 5 — Métricas do anunciante
O painel já mostra visualizações e cliques no WhatsApp para freteiros nos últimos 30 dias. **Pendente:** instrumentação confiável de visualizações/contatos de imóveis, contagem agregada e medidas contra abuso. Evitar expor dados individuais dos visitantes.

## Etapa 6 — Monitoramento técnico de SEO
Checklist de operação:
- Conferir /robots.txt e /sitemap.xml após deploy.
- Validar canonical e indexabilidade de amostras de páginas com anúncios ativos.
- Acompanhar Search Console: descoberta, rastreamento, indexação, Core Web Vitals e erros 404.
- Validar dados estruturados de imóveis e serviços com o Rich Results Test/Schema Validator.
- Conferir links internos e páginas de categorias vazias.
- Reavaliar 2–4 semanas após cada alteração; indexação não é garantida.

## Publicação
1. Executar lint, build e smoke tests no preview da Vercel.
2. Revisar acessibilidade e responsividade no celular.
3. Mesclar um PR por vez, monitorar erros e ter plano de reversão.
4. Não colocar credenciais, chaves privadas ou dados pessoais em PRs.
