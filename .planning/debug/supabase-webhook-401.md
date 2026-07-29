---
slug: supabase-webhook-401
status: resolved
trigger: manual
created: 2026-05-24
resolved: 2026-05-24
---

# Debug: Supabase Edge Function webhook returning 401

## Symptoms
- Database webhook trigger `on_session_insert_notify` calls Edge Function `notify-session-created` via `pg_net`
- Edge Function deployed with `--no-verify-jwt`
- Still returns 401 "Missing authorization header"
- Three attempts documented in `net._http_response`:
  - id 18003: 401 INVALID_JWT_FORMAT (original, sb_publishable_ key used as Bearer token)
  - id 18015: 401 NO_AUTH_HEADER (direct pg_net test, no auth header)
  - id 18017: 401 NO_AUTH_HEADER (apikey header approach, still no Authorization header)

## Current Focus
hypothesis: CONFIRMED -- The `--no-verify-jwt` flag was not actually applied to the deployed function. Redeploying with the flag fixed it.
next_action: none (resolved)

## Evidence
- timestamp: 2026-05-24 evidence: The .env file contains `VITE_SUPABASE_KEY= sb_publishable_1apfaux2Mrsf7dTHd5JF9g_imDnVYhF` which is the new Supabase publishable key format, NOT the traditional JWT anon key
- timestamp: 2026-05-24 evidence: The trigger function uses `apikey` header from Vault secret named 'anon_key', but if that Vault secret also contains the sb_publishable_ format key, the API Gateway will reject it
- timestamp: 2026-05-24 evidence: Edge Function has no auth logic of its own - it uses Deno.serve() directly with no JWT verification code
- timestamp: 2026-05-24 evidence: The migration file shows the original design used `Authorization: Bearer <anon_key>` which also would not work with sb_publishable_ format
- timestamp: 2026-05-24 evidence: curl test with NO headers returned 401 UNAUTHORIZED_NO_AUTH_HEADER -- confirmed gateway/relay layer rejects unauthenticated requests when --no-verify-jwt is not set
- timestamp: 2026-05-24 evidence: Response headers show `x-served-by: supabase-edge-runtime` and `sb-gateway-version: 1` -- the auth check comes from the Supabase edge relay, not an external gateway
- timestamp: 2026-05-24 evidence: After redeploying with `npx supabase functions deploy notify-session-created --project-ref pldrrgqoywiygixrtbfj --no-verify-jwt`, curl test with NO headers returned HTTP 200 "no recipients" -- function is now accessible without auth
- timestamp: 2026-05-24 evidence: curl test with `apikey: sb_publishable_...` header also returned HTTP 200 after redeploy -- confirms trigger's current apikey header will not cause issues

## Resolution
root_cause: The `--no-verify-jwt` flag was not properly applied to the deployed Edge Function. Despite being used during a previous deploy attempt, the function (at version 3) was still enforcing JWT verification. The Supabase edge runtime relay checks for an Authorization header before the request reaches the function code; when `--no-verify-jwt` is set, this check is skipped entirely.
fix: Redeployed the Edge Function with `npx supabase functions deploy notify-session-created --project-ref pldrrgqoywiygixrtbfj --no-verify-jwt`. The function now accepts requests without any auth headers (HTTP 200 confirmed via curl). The existing trigger function using the `apikey` header from Vault also works correctly.

## Remaining Action
The user should verify the end-to-end flow by inserting a session record and checking `net._http_response` for a 200 status. Run this SQL in Supabase Dashboard:

```sql
-- Check latest pg_net responses
SELECT id, status_code, content::text
FROM net._http_response
ORDER BY id DESC
LIMIT 5;
```

## Trigger Simplification (Optional)
Since `--no-verify-jwt` is now active, the trigger can be simplified to remove the Vault lookup entirely:

```sql
CREATE OR REPLACE FUNCTION notify_session_created_webhook()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://pldrrgqoywiygixrtbfj.supabase.co/functions/v1/notify-session-created',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := row_to_json(NEW)::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This removes the dependency on Vault secrets for this trigger.
