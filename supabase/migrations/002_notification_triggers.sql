-- =====================================================
-- Notification Infrastructure Migration
-- Phase 4: Push Notifications
-- Creates sent_reminders idempotency table + pg_cron schedule
-- =====================================================

-- Section 1: sent_reminders idempotency table
CREATE TABLE IF NOT EXISTS public.sent_reminders (
  session_id    UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  sent_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, reminder_type)
);

-- RLS: only service role accesses this table (Edge Functions use service key)
ALTER TABLE public.sent_reminders ENABLE ROW LEVEL SECURITY;
-- No user-facing policies needed — only service_role key accesses this table

-- Section 2: pg_cron schedule for session reminders (every 5 minutes)
-- NOTE: Run this block manually in the Supabase SQL Editor AFTER:
--   1. Enabling the pg_cron and pg_net extensions (Dashboard > Database > Extensions)
--   2. Adding project_url and anon_key secrets to Supabase Vault
--      (Dashboard > Project Settings > Vault)
--   3. Deploying the send-session-reminders Edge Function
--
-- SELECT cron.schedule(
--   'send-session-reminders',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-session-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
