-- Códigos públicos estáveis para URLs canônicas de imóveis e freteiros.
-- A migration é idempotente para permitir execução segura no deploy.
alter table public."Property"
  add column if not exists "publicCode" text;

alter table public."FreighterProfile"
  add column if not exists "publicCode" text;

update public."Property"
set "publicCode" = 'anv-' || substr(md5(id), 1, 10)
where "publicCode" is null;

update public."FreighterProfile"
set "publicCode" = 'anv-' || substr(md5(id), 1, 10)
where "publicCode" is null;

alter table public."Property"
  alter column "publicCode" set not null;

alter table public."FreighterProfile"
  alter column "publicCode" set not null;

create unique index if not exists "Property_publicCode_key"
  on public."Property" ("publicCode");

create unique index if not exists "FreighterProfile_publicCode_key"
  on public."FreighterProfile" ("publicCode");

drop index if exists public."Property_slug_key";
drop index if exists public."FreighterProfile_slug_key";

create index if not exists "Property_slug_idx"
  on public."Property" (slug);

create index if not exists "FreighterProfile_slug_idx"
  on public."FreighterProfile" (slug);
