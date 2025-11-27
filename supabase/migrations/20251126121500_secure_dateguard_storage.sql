-- Ensure DateGuard bucket is private and protected by RLS
update storage.buckets
set public = false
where id = 'dateguard-pre-activation';

drop policy if exists "Users can upload to dateguard-pre-activation" on storage.objects;
drop policy if exists "Users can view dateguard-pre-activation" on storage.objects;
drop policy if exists "Users can delete dateguard-pre-activation" on storage.objects;

create policy "Users can upload to dateguard-pre-activation"
on storage.objects
for insert
with check (
  bucket_id = 'dateguard-pre-activation'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view dateguard-pre-activation"
on storage.objects
for select
using (
  bucket_id = 'dateguard-pre-activation'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete dateguard-pre-activation"
on storage.objects
for delete
using (
  bucket_id = 'dateguard-pre-activation'
  and auth.uid()::text = (storage.foldername(name))[1]
);


