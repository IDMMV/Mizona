import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido.' }, { status: 405, headers: corsHeaders });
  }

  try {
    const { identifier, password } = await request.json();
    const username = String(identifier || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!/^[a-z0-9_]{4,20}$/.test(username) || cleanPassword.length < 6) {
      return Response.json({ error: 'Credenciales inválidas.' }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Faltan secretos de Supabase en la función.');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id,status')
      .eq('username', username)
      .maybeSingle();

    if (profileError || !profile || profile.status !== 'active') {
      return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401, headers: corsHeaders });
    }

    const { data: authUser, error: userError } = await adminClient.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email;

    if (userError || !email) {
      return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401, headers: corsHeaders });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: sessionData, error: loginError } = await authClient.auth.signInWithPassword({
      email,
      password: cleanPassword
    });

    if (loginError || !sessionData.session) {
      return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401, headers: corsHeaders });
    }

    return Response.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      token_type: sessionData.session.token_type
    }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'No se pudo iniciar sesión por usuario.' }, { status: 500, headers: corsHeaders });
  }
});
