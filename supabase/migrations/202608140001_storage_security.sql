-- Execute esta migration após a migration inicial do Prisma.
-- O aplicativo acessa as tabelas do marketplace pelo backend Prisma.
-- RLS sem políticas públicas impede acesso direto via Data API.

alter table public."User" enable row level security;
alter table public."City" enable row level security;
alter table public."Neighborhood" enable row level security;
alter table public."Property" enable row level security;
alter table public."PropertyImage" enable row level security;
alter table public."FreighterProfile" enable row level security;
alter table public."FreighterService" enable row level security;
alter table public."FreighterImage" enable row level security;
alter table public."Review" enable row level security;
alter table public."Favorite" enable row level security;
alter table public."Report" enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'property-images',
    'property-images',
    true,
    8388608,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'freighter-images',
    'freighter-images',
    true,
    8388608,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Marketplace images are publicly readable"
on storage.objects for select
to public
using (bucket_id in ('property-images', 'freighter-images'));

create policy "Users upload marketplace images to their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('property-images', 'freighter-images')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users update marketplace images in their own folder"
on storage.objects for update
to authenticated
using (
  bucket_id in ('property-images', 'freighter-images')
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id in ('property-images', 'freighter-images')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users delete marketplace images in their own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('property-images', 'freighter-images')
  and owner_id = (select auth.uid()::text)
);
