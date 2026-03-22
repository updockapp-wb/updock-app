-- Phase 5: Anonymous Access — allow anon role to read community data
-- Reviews: anon can read all reviews (needed for SpotDetail reviews tab)
CREATE POLICY "reviews_select_anon" ON public.reviews
  FOR SELECT TO anon USING (true);

-- Sessions: anon can read all sessions (needed for SpotDetail sessions tab)
CREATE POLICY "sessions_select_anon" ON public.sessions
  FOR SELECT TO anon USING (true);

-- Session attendees: anon can read attendee data (needed for participant counts)
CREATE POLICY "session_attendees_select_anon" ON public.session_attendees
  FOR SELECT TO anon USING (true);
