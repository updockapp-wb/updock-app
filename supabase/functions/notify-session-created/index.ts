import { createClient } from 'npm:@supabase/supabase-js@^2.87.0';
import { encodeBase64Url } from 'https://deno.land/std@0.224.0/encoding/base64url.ts';
import serviceAccount from '../service-account.json' with { type: 'json' };

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = encodeBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = encodeBase64Url(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const keyData = pemToArrayBuffer(serviceAccount.private_key);
  const key = await crypto.subtle.importKey(
    'pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsignedToken));
  const jwt = `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  console.log('[AUTH] OAuth response status:', resp.status, 'has token:', !!data.access_token, 'token prefix:', data.access_token?.slice(0, 20));
  if (!resp.ok) throw new Error(`Google OAuth error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function sendFcmMessage(
  accessToken: string,
  fcmToken: string,
  notification: { title: string; body: string }
): Promise<{ success: boolean; unregistered: boolean; error?: string }> {
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
    console.error('[FCM] error:', response.status, JSON.stringify(errorBody));
    const isUnregistered =
      errorBody?.error?.status === 'NOT_FOUND' ||
      errorBody?.error?.details?.some?.(
        (d: { errorCode?: string }) => d.errorCode === 'UNREGISTERED'
      );
    return { success: false, unregistered: !!isUnregistered, error: JSON.stringify(errorBody) };
  }
  return { success: true, unregistered: false };
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // Support both webhook format (row_to_json(NEW) directly) and manual invocation ({ record: ... })
    const session = payload.record ?? payload;
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

    // 3b. Filter out users who opted out of session notifications
    const { data: optedInUsers } = await supabase
      .from('profiles')
      .select('id')
      .in('id', userIds)
      .eq('notif_session_enabled', true);

    if (!optedInUsers?.length) return new Response('no recipients (all opted out)', { status: 200 });

    const filteredUserIds = optedInUsers.map((u: { id: string }) => u.id);

    // 4. Get push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', filteredUserIds);

    if (!tokens?.length) return new Response('no tokens', { status: 200 });

    // 5. Send FCM messages in parallel
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch (authErr) {
      return new Response(JSON.stringify({ error: 'google_auth_failed', detail: String(authErr) }), { status: 200 });
    }
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

    const errors = results.filter((r) => !r.success).map((r) => r.error);
    return new Response(
      JSON.stringify({
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        errors,
        stale_cleaned: staleTokens.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[notify-session-created]', error);
    return new Response('internal error', { status: 500 });
  }
});
