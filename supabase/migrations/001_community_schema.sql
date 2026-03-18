-- =====================================================
-- Community Features Schema Migration
-- Phase 1: Foundation — all 5 tables + RLS + view
-- Run against existing database with profiles/spots/favorites
-- =====================================================

-- Section 1: Extend profiles table with display_name and avatar_url
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Section 2: Recreate new-user trigger safely (adds ON CONFLICT guard)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_id)
  VALUES (NEW.id, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Section 3: reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id    UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (spot_id, user_id)
);
CREATE INDEX IF NOT EXISTS reviews_spot_id_idx ON public.reviews(spot_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Section 4: spot_ratings view (avg rating and review count per spot)
CREATE OR REPLACE VIEW public.spot_ratings AS
SELECT
  spot_id,
  COUNT(*)              AS review_count,
  ROUND(AVG(rating), 1) AS avg_rating
FROM public.reviews
GROUP BY spot_id;

-- Section 5: sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id      UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  creator_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at    TIMESTAMPTZ NOT NULL,
  note         TEXT CHECK (char_length(note) <= 500),
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_spot_id_idx ON public.sessions(spot_id);
CREATE INDEX IF NOT EXISTS sessions_starts_at_idx ON public.sessions(starts_at);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Section 6: session_attendees table
CREATE TABLE IF NOT EXISTS public.session_attendees (
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_attendees_select" ON public.session_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "session_attendees_insert" ON public.session_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "session_attendees_delete" ON public.session_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Section 7: push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_tokens_own" ON public.push_tokens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
