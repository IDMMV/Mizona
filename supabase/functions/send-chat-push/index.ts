// Supabase Edge Function: send-chat-push
// Variables necesarias en Supabase:
// FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY
// La private key debe guardarse con saltos \n o como texto multilinea.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function base64url(input: string) {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function importPrivateKey(pem: string) {
  const clean = pem.replace(/\\n/g, '\n').replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binary = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', binary.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

async function getAccessToken() {
  const clientEmail = Deno.env.get('FCM_CLIENT_EMAIL') || '';
  const privateKey = Deno.env.get('FCM_PRIVATE_KEY') || '';
  if (!clientEmail || !privateKey) throw new Error('Faltan FCM_CLIENT_EMAIL o FCM_PRIVATE_KEY en Supabase.');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(String.fromCharCode(...new Uint8Array(signature)))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error_description || data?.error || 'No se pudo obtener token OAuth de Google.');
  return data.access_token as string;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const projectId = Deno.env.get('FCM_PROJECT_ID') || '';
    if (!supabaseUrl || !serviceRole || !projectId) throw new Error('Faltan variables SUPABASE o FCM_PROJECT_ID.');

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, serviceRole, { global: { headers: { Authorization: authHeader } } });
    const { data: authData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!authData?.user) throw new Error('Usuario no autenticado.');

    const body = await req.json().catch(() => ({}));
    const conversationId = body.conversationId;
    const title = body.title || 'Nuevo mensaje en MiZona Chat';
    const text = body.body || 'Tienes un nuevo mensaje.';
    if (!conversationId) throw new Error('Falta conversationId.');

    const { data: members, error: memberError } = await supabase
      .from('mz_conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', authData.user.id);
    if (memberError) throw memberError;

    const userIds = (members || []).map((m: any) => m.user_id);
    if (!userIds.length) return Response.json({ sent: 0, reason: 'Sin destinatarios' }, { headers: corsHeaders });

    const { data: tokens, error: tokenError } = await supabase
      .from('mz_push_tokens')
      .select('fcm_token,user_id')
      .in('user_id', userIds)
      .eq('active', true);
    if (tokenError) throw tokenError;

    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    let sent = 0;
    const failed: string[] = [];
    for (const row of tokens || []) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: row.fcm_token,
            notification: { title, body: text },
            data: { page: 'chat', url: '/#chat', type: 'chat', conversationId: String(conversationId) },
            webpush: { fcm_options: { link: '/#chat' } }
          }
        })
      });
      if (response.ok) sent += 1;
      else failed.push(row.fcm_token);
    }

    return Response.json({ sent, failed: failed.length, recipients: userIds.length }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: String(error?.message || error) }, { status: 400, headers: corsHeaders });
  }
});
