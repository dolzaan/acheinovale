-- Bucket público para avatares. Escrita direta é limitada à pasta do usuário;
-- o backend também confirma a sessão antes de qualquer upload administrativo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profile images are publicly readable" on storage.objects;
create policy "Profile images are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'profile-images');

drop policy if exists "Users upload their own profile images" on storage.objects;
create policy "Users upload their own profile images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users update their own profile images" on storage.objects;
create policy "Users update their own profile images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-images'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users delete their own profile images" on storage.objects;
create policy "Users delete their own profile images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and owner_id = (select auth.uid()::text)
);
