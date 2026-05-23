-- 1. Backfill: set display_name from first_name for existing users missing it
UPDATE public.profiles p
SET display_name = TRIM(u.raw_user_meta_data->>'first_name')
FROM auth.users u
WHERE p.id = u.id
  AND (p.display_name IS NULL OR TRIM(p.display_name) = '')
  AND NULLIF(TRIM(u.raw_user_meta_data->>'first_name'), '') IS NOT NULL;

-- 2. Update trigger to prefer display_name metadata (new signup flow),
--    falling back to first_name if display_name is absent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_id, display_name)
  VALUES (
    new.id,
    1,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'first_name'), '')
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
