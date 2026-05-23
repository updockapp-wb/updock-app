-- 1. Mettre à jour le trigger pour peupler display_name à la création
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_id, display_name)
  VALUES (
    new.id,
    1,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'username'), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'first_name'), '')
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill des utilisateurs existants sans display_name
UPDATE public.profiles p
SET display_name = COALESCE(
  NULLIF(TRIM(u.raw_user_meta_data->>'username'), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'first_name'), '')
)
FROM auth.users u
WHERE p.id = u.id
  AND (p.display_name IS NULL OR TRIM(p.display_name) = '');
