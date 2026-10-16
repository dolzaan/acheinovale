# Conectar o AcheiNoVale ao Supabase

O projeto usa:

- **Supabase Auth** para login com Google e sessões.
- **Supabase Storage** para fotos de perfil, fotos e vídeos de imóveis e fotos de freteiros.
- **Supabase Postgres + Prisma** para os dados do marketplace.

As tabelas não são consultadas diretamente pelo navegador. O backend Prisma concentra autorização e regras de negócio; o Supabase Client no navegador é usado para autenticação e uploads protegidos por RLS.

## 1. Criar o projeto

Crie um projeto no Supabase e guarde a senha do banco. No painel, abra **Connect** e copie:

- Project URL.
- Publishable key.
- Transaction pooler, porta `6543`.
- Direct connection ou Session pooler, porta `5432`.

Para Vercel/serverless, use o transaction pooler em `POSTGRES_PRISMA_URL`. O aplicativo força `pgbouncer=true` e limita o pool a no máximo 2 conexões (`PRISMA_CONNECTION_LIMIT`). Use a conexão direta ou o session pooler em `POSTGRES_URL_NON_POOLING` para migrations.

## 2. Variáveis locais

Copie `.env.example` para `.env.local` e substitua os valores:

```env
POSTGRES_PRISMA_URL="postgresql://...:6543/postgres?pgbouncer=true&connection_limit=2"
POSTGRES_URL_NON_POOLING="postgresql://...:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://SEU_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SECRET_KEY="sb_secret_..."
NEXT_PUBLIC_GOOGLE_CLIENT_ID="000000000000-example.apps.googleusercontent.com"
SUPABASE_PROJECT_REF="SEU_PROJECT_REF"
```

Nunca coloque `SUPABASE_SECRET_KEY` em variável iniciada por `NEXT_PUBLIC_`.

## 3. Criar as tabelas

Com as variáveis configuradas:

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

As migrations Prisma criam as tabelas. O seed ativa Rio do Sul e cadastra bairros iniciais.

## 4. Ativar RLS, Storage e busca

Depois das migrations Prisma, abra o **SQL Editor** do Supabase e execute, em ordem, os arquivos de `supabase/migrations/`:

1. `202608140001_storage_security.sql` — RLS nas tabelas, buckets `property-images` e `freighter-images`, leitura pública e escrita restrita à pasta do usuário.
2. `202608150001_profile_images.sql` — bucket `profile-images` (até 4 MB).
3. `202608150002_renomear_banco_para_portugues.sql` e `202608150003_remover_views_compatibilidade.sql` — nomes das tabelas em português, usados pelo `schema.prisma`.
4. `202608150004_melhorar_busca_imoveis.sql`, `202608150005_ajustar_precisao_busca.sql` e `202609010001_busca_imoveis_por_cidade.sql` — função `private.buscar_imoveis`.
5. `202609010002_integrar_localidades_ibge_viacep.sql` — municípios do Alto Vale com código IBGE.

Para aceitar vídeos no bucket de imóveis, rode também `node scripts/configure-property-media-bucket.mjs`.

O aplicativo limita fotos otimizadas a 2 MB e vídeos a 20 MB. Uploads de imóveis e de freteiros só são aceitos pelo Storage quando o servidor criou antes uma autorização (`autorizacoes_upload_midia`) válida por 15 minutos.

## 5. Configurar autenticação

O login usa o Google Identity Services no navegador (`components/google-sign-in-button.tsx`) e troca o token do Google por uma sessão do Supabase com `signInWithIdToken`. Em seguida, `/auth/google` sincroniza o usuário com a tabela `usuarios`.

1. No Google Cloud, crie um cliente OAuth do tipo Web e adicione as origens JavaScript autorizadas (`http://localhost:3000` e o domínio de produção).
2. No Supabase, habilite o provider Google e informe o mesmo Client ID.
3. Defina `NEXT_PUBLIC_GOOGLE_CLIENT_ID` com esse Client ID.

A rota `/auth/callback` continua disponível para o fluxo OAuth com redirecionamento (PKCE). Se usá-la, cadastre `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback` no Google e `https://SEU-DOMINIO/auth/callback` nas Redirect URLs do Supabase.

Os cookies de sessão são `httpOnly`, `sameSite` e `secure` em produção por meio do cliente SSR oficial.

## 6. Variáveis e deploy na Vercel

Cadastre as mesmas variáveis em **Project Settings → Environment Variables**.

Defina também `CRON_SECRET` com um valor aleatório longo. O cron diário configurado em `vercel.json` chama `/api/cron/expirar-anuncios`, que pausa imóveis sem confirmação de disponibilidade há 60 dias (45 dias até o aviso + 15 de tolerância). Sem essa variável, a rota recusa a chamada e nada é pausado.

No build de produção, `scripts/build.mjs` reaplica algumas migrations idempotentes listadas no próprio script (índices, limites de requisição, métricas e políticas de upload). As demais migrations Prisma devem ser aplicadas conscientemente com `npm run db:migrate:deploy`.

## Estrutura

- `lib/supabase/client.ts`: Client Components.
- `lib/supabase/server.ts`: Server Components, actions e routes.
- `lib/supabase/admin.ts`: operações administrativas com service role.
- `lib/supabase/proxy.ts` e `proxy.ts`: renovação segura de sessão.
- `lib/auth/current-user.ts`: usuário atual e guards.
- `lib/auth/sync-user.ts`: sincronização Auth → Prisma.
- `app/auth/google/route.ts`: sincronização após o login com Google.
- `app/auth/callback/route.ts`: callback OAuth/PKCE.
- `app/auth/actions.ts`: logout.
- `lib/db.ts`: Prisma singleton para ambiente serverless.

Enquanto as variáveis do Supabase não forem cadastradas, a home continua funcionando e o proxy permanece em modo inativo.
