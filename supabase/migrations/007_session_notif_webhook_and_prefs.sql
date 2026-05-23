-- =====================================================
-- Session Notification Webhook + Notification Preferences
-- Adds notif_session_enabled preference column on profiles
-- and database webhook trigger for session creation notifications
-- =====================================================

-- Section 1: notif_session_enabled column on profiles
-- Users can opt out of session creation push notifications
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notif_session_enabled BOOLEAN DEFAULT true;

-- Section 2: Database webhook for session creation (commented, manual activation)
-- NOTE: Run this block manually in the Supabase SQL Editor AFTER:
--   1. Enabling the pg_net extension in Dashboard > Database > Extensions (if not already enabled)
--   2. Adding project_url and anon_key secrets to Supabase Vault
--      (Dashboard > Project Settings > Vault) — same secrets as 002 migration
--   3. Deploying the notify-session-created Edge Function
--
-- CREATE OR REPLACE FUNCTION notify_session_created_webhook()
-- RETURNS trigger AS $$
-- BEGIN
--   PERFORM net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
--            || '/functions/v1/notify-session-created',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
--     ),
--     body := row_to_json(NEW)::jsonb
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER on_session_insert_notify
--   AFTER INSERT ON public.sessions
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_session_created_webhook();
