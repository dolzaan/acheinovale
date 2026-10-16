# AcheiNoVale

Marketplace hiperlocal de imóveis e freteiros, começando por Rio do Sul (SC).

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## O que o projeto contém

- Catálogo de imóveis com filtros, busca textual e páginas por cidade do Alto Vale.
- Catálogo e perfis de freteiros, com métricas de visualizações e contatos.
- Publicação de imóveis e freteiros com fotos e vídeo, sujeita à moderação.
- Login com Google, perfil do usuário e área "Meus anúncios".
- Painel administrativo de anúncios, bairros e denúncias.
- Prisma + Supabase (Auth, Storage, Postgres) e deploy na Vercel.

Consulte `docs/ARQUITETURA_MVP.md` para o recorte, as rotas e a sequência recomendada.
Para conectar o backend, siga `docs/SUPABASE_SETUP.md`.
