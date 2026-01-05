-- 1. Create the 'spots' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('spots', 'spots', true)
on conflict (id) do nothing;

-- 2. Remove existing policies to avoid conflicts (optional, but safe)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Uploads" on storage.objects;

-- 3. Policy: Allow EVERYONE to view images (Select) in 'spots' bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'spots' );

-- 4. Policy: Allow AUTHENTICATED users to upload (Insert) to 'spots' bucket
create policy "Authenticated Uploads"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'spots' );

-- 5. Policy: Allow users to delete their own uploads (Optional but good)
create policy "User Delete Own Images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'spots' and owner = auth.uid() );
