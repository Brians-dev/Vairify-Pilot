-- Storage bucket for profile avatars
insert into storage.buckets (id, name, public)
values ('profile_avatars', 'profile_avatars', true)
on conflict (id) do nothing;

create policy "Users can upload their avatars"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile_avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their avatars"
  on storage.objects
  for update
  using (
    bucket_id = 'profile_avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile_avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their avatars"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile_avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view profile avatars"
  on storage.objects
  for select
  using (bucket_id = 'profile_avatars');


