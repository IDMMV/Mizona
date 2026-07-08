import { hasSupabase, supabase } from './supabase';

export async function runCloudHealthCheck() {
  const checks = [];
  const push = (id, label, ok, detail, severity = ok ? 'ok' : 'error') => checks.push({ id, label, ok, detail, severity });

  if (!hasSupabase || !supabase) {
    push('config', 'Variables de Supabase', false, 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
    return checks;
  }
  push('config', 'Variables de Supabase', true, 'URL y anon key detectadas.');

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    push('auth', 'Servicio de autenticación', true, data?.session ? 'Sesión activa.' : 'Servicio disponible; todavía no hay sesión.');
  } catch (error) {
    push('auth', 'Servicio de autenticación', false, error.message);
  }

  for (const [id, label, table] of [
    ['profiles', 'Tabla de perfiles', 'profiles'],
    ['modules', 'Configuración de módulos', 'app_modules'],
    ['notifications', 'Notificaciones reales', 'mz_notifications'],
    ['devices', 'Dispositivos', 'mz_devices']
  ]) {
    try {
      const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1);
      if (error) throw error;
      push(id, label, true, `Tabla ${table} accesible.`);
    } catch (error) {
      push(id, label, false, error.message);
    }
  }

  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    push('storage', 'Storage', true, `${data?.length || 0} buckets visibles para esta sesión.`);
  } catch (error) {
    push('storage', 'Storage', false, error.message, 'warning');
  }

  return checks;
}

export async function loadCloudNotifications(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('mz_notifications')
    .select('id,type,title,body,entity_type,entity_id,read_at,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.body || '',
    entityType: item.entity_type,
    entityId: item.entity_id,
    read: Boolean(item.read_at),
    createdAt: item.created_at,
    source: 'cloud'
  }));
}

export async function markCloudNotification(id, read = true) {
  if (!supabase) return;
  const { error } = await supabase.from('mz_notifications').update({ read_at: read ? new Date().toISOString() : null }).eq('id', id);
  if (error) throw error;
}

export async function markAllCloudNotificationsRead(userId) {
  if (!supabase || !userId) return;
  const { error } = await supabase.from('mz_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
  if (error) throw error;
}

export async function saveCloudPreferences(userId, preferences) {
  if (!supabase || !userId) return;
  const payload = {
    user_id: userId,
    push_enabled: preferences.push !== false,
    email_enabled: preferences.email !== false,
    marketing_enabled: preferences.marketing === true,
    quiet_hours: preferences.quietHours || {},
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('mz_notification_preferences').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export function subscribeCloudNotifications(userId, onChange) {
  if (!supabase || !userId) return () => {};
  const channel = supabase
    .channel(`mizona-notifications-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_notifications', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
