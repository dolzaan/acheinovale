# Conectar o AcheiNoVale ao Supabase

O projeto está preparado para usar:

- **Supabase Auth** para Google, e-mail, senha e sessões.
- **Supabase Storage** para fotos de imóveis e freteiros.
- **Supabase Postgres + Prisma** para os dados do marketplace.

As tabelas não são consultadas diretamente pelo navegador. O backend Prisma concentra autorização e regras de negócio; o Supabase Client no navegador é usado para autenticação e uploads protegidos por RLS.

## 1. Criar o projeto

Crie um projeto no Supabase e guarde a senha do banco. No painel, abra **Connect** e copie:

- Project URL.
- Publishable key.
- Transaction pooler, porta `6543`.
- Direct connection ou Session pooler, porta `5432`.

Para Vercel/serverless, use o transaction pooler em `POSTGRES_PRISMA_URL` com `connection_limit=1`. Use a conexão direta ou o session pooler em `POSTGRES_URL_NON_POOLING` para migrations.

## 2. Variáveis locais

Copie `.env.example` para `.env.local` e substitua os valores:

```env
POSTGRES_PRISMA_URL="postgresql://...:6543/postgres?pgbouncer=true&connection_limit=1"
POSTGRES_URL_NON_POOLING="postgresql://...:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://SEU_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SECRET_KEY="sb_secret_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
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

A migration inicial cria as tabelas. O seed ativa Rio do Sul e cadastra os bairros iniciais usados na demonstração.

## 4. Ativar RLS e Storage

Depois da migration Prisma, abra o **SQL Editor** do Supabase e execute:

`supabase/migrations/202608140001_storage_security.sql`

O script:

- ativa RLS nas tabelas do marketplace;
- cria `property-images` e `freighter-images`;
- limita uploads a 8 MB;
- aceita JPEG, PNG, WebP e AVIF;
- permite leitura pública das imagens;
- restringe escrita e exclusão à pasta do usuário autenticado.

## 5. Configurar autenticação

Em **Authentication → URL Configuration**:

- Site URL local: `http://localhost:3000`.
- Redirect URL local: `http://localhost:3000/auth/callback`.
- Site URL de produção: o domínio da Vercel.
- Redirect URL de produção: `https://SEU-DOMINIO/auth/callback`.

Para Google, habilite o provider no Supabase e cadastre no Google Cloud o callback exibido pelo próprio Supabase. O aplicativo redireciona de volta por `/auth/callback`, troca o código por sessão e sincroniza o usuário autenticado com a tabela `User`.

No cliente OAuth do Google, o redirect autorizado é o callback do Supabase:

```text
https://SEU_PROJECT_REF.supabase.co/auth/v1/callback
```

No Supabase, adicione à lista de Redirect URLs:

```text
http://localhost:3000/auth/callback
https://acheinovale.vercel.app/auth/callback
```

O Supabase usa PKCE e valida o `state` do OAuth. Os cookies de sessão são `httpOnly`, `sameSite` e `secure` em produção por meio do cliente SSR oficial.

## 6. Variáveis na Vercel

Cadastre as mesmas variáveis em **Project Settings → Environment Variables**. Em produção, altere:

```env
NEXT_PUBLIC_APP_URL="https://SEU-DOMINIO"
```

Não execute migrations durante cada build. Rode `npm run db:migrate:deploy` conscientemente quando houver nova migration.

## Estrutura criada

- `lib/supabase/client.ts`: Client Components.
- `lib/supabase/server.ts`: Server Components, actions e routes.
- `lib/supabase/admin.ts`: operações administrativas com service role.
- `lib/supabase/proxy.ts` e `proxy.ts`: renovação segura de sessão.
- `lib/auth/current-user.ts`: usuário atual e guards.
- `lib/auth/sync-user.ts`: sincronização Auth → Prisma.
- `app/auth/actions.ts`: Google, senha, cadastro e logout.
- `app/auth/callback/route.ts`: callback OAuth/PKCE.
- `lib/db.ts`: Prisma singleton para ambiente serverless.

Enquanto as variáveis do Supabase não forem cadastradas, a home continua funcionando e o proxy permanece em modo inativo.
