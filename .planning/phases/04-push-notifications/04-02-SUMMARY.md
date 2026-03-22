---
phase: 04-push-notifications
plan: "02"
subsystem: server-side-notifications
tags:
  - edge-functions
  - fcm
  - push-notifications
  - pg-cron
  - supabase
dependency_graph:
  requires:
    - 04-01 (push_tokens table, client FCM registration)
    - 001_community_schema.sql (sessions, session_attendees, favorites, spots, profiles tables)
  provides:
    - notify-session-created Edge Function (NOTIF-02)
    - send-session-reminders Edge Function (NOTIF-03)
    - sent_reminders idempotency table
    - pg_cron schedule template
  affects:
    - push_tokens table (stale token cleanup on UNREGISTERED FCM error)
tech_stack:
  added:
    - google-auth-library@^9.0.0 (npm: import in Deno) — OAuth2 service account auth for FCM v1
    - @supabase/supabase-js@^2.87.0 (npm: import in Deno) — DB queries from Edge Functions
  patterns:
    - Supabase database webhook triggering Edge Function on sessions INSERT
    - pg_cron + pg_net for scheduled Edge Function invocation every 5 minutes
    - FCM v1 API with OAuth2 bearer token (not legacy FCM HTTP API)
    - Idempotency via unique constraint (sent_reminders composite PK)
    - Parallel FCM dispatch with Promise.all (not serial loop)
key_files:
  created:
    - supabase/functions/notify-session-created/index.ts
    - supabase/functions/send-session-reminders/index.ts
    - supabase/migrations/002_notification_triggers.sql
  modified: []
decisions:
  - "Service role key used in Edge Functions (SUPABASE_SERVICE_ROLE_KEY) to bypass RLS — webhooks have no user JWT"
  - "Reminder window is 55-65 minutes (REMINDER_WINDOW_MINUTES +/- 5 min) to ensure 5-minute cron interval catches each session exactly once"
  - "pg_cron schedule commented out in migration — requires Vault secrets (project_url, anon_key) to be configured first; user runs SQL manually after setup"
  - "Stale token cleanup uses DELETE IN (tokens) batch rather than per-token delete for efficiency"
metrics:
  duration: "~30 min (including human verification)"
  completed_date: "2026-03-22"
  tasks_completed: 3
  files_created: 3
  files_modified: 0
---

# Phase 04 Plan 02: Server-Side Notification Dispatch Summary

**One-liner:** FCM v1 dispatch via two Supabase Edge Functions — favorites-based new-session notification (webhook) and attendee reminders (pg_cron), both with service account OAuth2 auth and idempotency guards.

## What Was Built

### notify-session-created Edge Function

`supabase/functions/notify-session-created/index.ts` — Called by a Supabase database webhook on every `sessions` INSERT.

Flow:
1. Parses webhook payload (`record.spot_id`, `record.creator_id`)
2. Fetches spot name from `spots` table
3. Fetches creator display name from `profiles` table
4. Queries `favorites` for users who favorited the spot, excluding the session creator
5. Returns early if no favoriting users or no push tokens found
6. Fetches Google OAuth2 access token via `google-auth-library` + `service-account.json`
7. Dispatches FCM v1 messages in parallel with `Promise.all`
8. Cleans up `UNREGISTERED`/`NOT_FOUND` stale tokens via batch DELETE

Notification content: `"New session at ${spotName}"` / `"${creatorName} is heading there on ${formattedDate}"`

### send-session-reminders Edge Function

`supabase/functions/send-session-reminders/index.ts` — Called by pg_cron every 5 minutes.

Flow:
1. Calculates reminder window: now + 55 min to now + 65 min (catches the 1-hour mark across any 5-min cron tick)
2. Queries non-cancelled sessions starting in that window
3. For each session: attempts INSERT into `sent_reminders` with `reminder_type = '1h'`
   - If INSERT fails (unique constraint) → already sent, skip
   - If INSERT succeeds → proceed to send
4. Fetches `session_attendees`, their push tokens, and spot name
5. Dispatches FCM v1 reminders in parallel
6. Accumulates stale tokens for batch cleanup

Notification content: `"Reminder: session in 1 hour"` / `"Your session at ${spotName} starts at ${sessionTime}"`

### Database Migration 002

`supabase/migrations/002_notification_triggers.sql`:
- Creates `sent_reminders` table with composite primary key `(session_id, reminder_type)` — the unique constraint enforces idempotency at the DB level
- RLS enabled, no user-facing policies (only `service_role` key accesses this table)
- pg_cron schedule SQL included as commented template — must be run manually after pg_cron/pg_net extension setup and Vault secret configuration

## Deviations from Plan

None — plan executed exactly as written.

## Setup Requirements (Completed by User)

All required external service configuration was completed by the user during Task 3 (human-verify checkpoint, approved 2026-03-22):

1. **Firebase service account:** Downloaded and placed as `supabase/functions/service-account.json` (gitignored).

2. **Edge Functions deployed:**
   - `notify-session-created` deployed to Supabase
   - `send-session-reminders` deployed to Supabase

3. **Migration applied:** `002_notification_triggers.sql` applied via Supabase SQL Editor (`sent_reminders` table created).

4. **Database webhook created:** sessions INSERT event triggers `notify-session-created` Edge Function.

5. **pg_cron + pg_net extensions enabled** in Supabase Dashboard.

6. **Vault secrets configured:** `project_url` and `anon_key` added to Supabase Vault.

7. **pg_cron job scheduled:** Runs every 5 minutes calling `send-session-reminders`.

## Self-Check: PASSED

Files exist:
- supabase/functions/notify-session-created/index.ts: FOUND
- supabase/functions/send-session-reminders/index.ts: FOUND
- supabase/migrations/002_notification_triggers.sql: FOUND

Commits:
- 2a86b1e: Task 1 — notify-session-created + migration
- d669861: Task 2 — send-session-reminders
- Task 3: human-verify checkpoint approved by user (no code commit — infrastructure deployed via Supabase Dashboard)
