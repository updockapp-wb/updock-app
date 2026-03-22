import { createClient } from 'npm:@supabase/supabase-js@^2.87.0';
import { GoogleAuth } from 'npm:google-auth-library@^9.0.0';
import serviceAccount from '../service-account.json' with { type: 'json' };

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const REMINDER_WINDOW_MINUTES = 60;
const REMINDER_TYPE = '1h';

const auth = new GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});

async function getAccessToken(): Promise<string> {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token!;
}

async function sendFcmMessage(
  accessToken: string,
  fcmToken: string,
  notification: { title: string; body: string }
): Promise<{ success: boolean; unregistered: boolean }> {
  const projectId = serviceAccount.project_id;
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { token: fcmToken, notification } }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const isUnregistered =
      errorBody?.error?.status === 'NOT_FOUND' ||
      errorBody?.error?.details?.some?.(
        (d: { errorCode?: string }) => d.errorCode === 'UNREGISTERED'
      );
    return { success: false, unregistered: !!isUnregistered };
  }
  return { success: true, unregistered: false };
}

Deno.serve(async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES - 5) * 60000);
    const windowEnd = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES + 5) * 60000);

    // Find sessions starting in ~1 hour, not cancelled
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, spot_id, starts_at')
      .eq('is_cancelled', false)
      .gte('starts_at', windowStart.toISOString())
      .lte('starts_at', windowEnd.toISOString());

    if (sessionsError) {
      console.error('[send-session-reminders] sessions query error:', sessionsError);
      return new Response('query error', { status: 500 });
    }

    if (!sessions?.length) {
      return new Response(JSON.stringify({ reminded: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken();
    let totalSent = 0;
    let totalSkipped = 0;
    const staleTokens: string[] = [];

    for (const session of sessions) {
      // Idempotency guard: try to insert reminder record
      const { error: guardError } = await supabase
        .from('sent_reminders')
        .insert({ session_id: session.id, reminder_type: REMINDER_TYPE });

      if (guardError) {
        // Already sent (unique constraint violation) — skip
        totalSkipped++;
        continue;
      }

      // Fetch attendees
      const { data: attendees } = await supabase
        .from('session_attendees')
        .select('user_id')
        .eq('session_id', session.id);

      if (!attendees?.length) continue;

      const userIds = attendees.map((a: { user_id: string }) => a.user_id);

      // Fetch push tokens for attendees
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .in('user_id', userIds);

      if (!tokens?.length) continue;

      // Fetch spot name
      const { data: spot } = await supabase
        .from('spots')
        .select('name')
        .eq('id', session.spot_id)
        .single();
      const spotName = spot?.name ?? 'your spot';

      // Format session time
      const sessionTime = new Date(session.starts_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Send reminders in parallel
      const results = await Promise.all(
        tokens.map(({ token }: { token: string }) =>
          sendFcmMessage(accessToken, token, {
            title: 'Reminder: session in 1 hour',
            body: `Your session at ${spotName} starts at ${sessionTime}`,
          }).then((result) => ({ token, ...result }))
        )
      );

      totalSent += results.filter((r) => r.success).length;
      staleTokens.push(...results.filter((r) => r.unregistered).map((r) => r.token));
    }

    // Cleanup stale tokens
    if (staleTokens.length > 0) {
      await supabase.from('push_tokens').delete().in('token', staleTokens);
    }

    return new Response(
      JSON.stringify({
        sessions_found: sessions.length,
        reminded: totalSent,
        skipped_already_sent: totalSkipped,
        stale_cleaned: staleTokens.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-session-reminders]', error);
    return new Response('internal error', { status: 500 });
  }
});
