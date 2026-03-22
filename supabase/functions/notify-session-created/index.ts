import { createClient } from 'npm:@supabase/supabase-js@^2.87.0';
import { GoogleAuth } from 'npm:google-auth-library@^9.0.0';
import serviceAccount from '../service-account.json' with { type: 'json' };

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    body: JSON.stringify({
      message: { token: fcmToken, notification },
    }),
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

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const session = payload.record;
    if (!session?.spot_id || !session?.creator_id) {
      return new Response('invalid payload', { status: 400 });
    }

    // 1. Fetch spot name
    const { data: spot } = await supabase
      .from('spots')
      .select('name')
      .eq('id', session.spot_id)
      .single();
    const spotName = spot?.name ?? 'a spot';

    // 2. Fetch creator display name
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.creator_id)
      .single();
    const creatorName = creatorProfile?.display_name ?? 'Someone';

    // 3. Find favoriting users (exclude creator)
    const { data: favUsers } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('spot_id', session.spot_id)
      .neq('user_id', session.creator_id);

    if (!favUsers?.length) return new Response('no recipients', { status: 200 });

    const userIds = favUsers.map((f: { user_id: string }) => f.user_id);

    // 4. Get push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    if (!tokens?.length) return new Response('no tokens', { status: 200 });

    // 5. Send FCM messages in parallel
    const accessToken = await getAccessToken();
    const formattedDate = new Date(session.starts_at).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const results = await Promise.all(
      tokens.map(({ token }: { token: string }) =>
        sendFcmMessage(accessToken, token, {
          title: `New session at ${spotName}`,
          body: `${creatorName} is heading there on ${formattedDate}`,
        }).then((result) => ({ token, ...result }))
      )
    );

    // 6. Cleanup stale tokens
    const staleTokens = results.filter((r) => r.unregistered).map((r) => r.token);
    if (staleTokens.length > 0) {
      await supabase.from('push_tokens').delete().in('token', staleTokens);
    }

    return new Response(
      JSON.stringify({
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        stale_cleaned: staleTokens.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[notify-session-created]', error);
    return new Response('internal error', { status: 500 });
  }
});
