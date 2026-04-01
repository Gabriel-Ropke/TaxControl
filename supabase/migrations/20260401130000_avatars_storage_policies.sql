-- Políticas de segurança para o bucket de avatars
-- Execute este SQL no SQL Editor do Supabase

-- 1. Allow authenticated users to upload their own avatar
create policy "Allow authenticated uploads to avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to update their own avatar
create policy "Allow authenticated updates to avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to delete their own avatar  
create policy "Allow authenticated deletes to avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow anyone to view (public read) avatars
create policy "Allow public read of avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');