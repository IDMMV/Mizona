import { supabase, hasSupabase } from './supabase';
import { listLocalSyncQueue, mutateLocalState, getActiveLocalProfileId } from './localStore';

const MAX_BATCH = 40;
const now = () => new Date().toISOString();

function normalizeEvent(item) {
  return {
    client_event_id: String(item.id),
    user_id: null,
    local_actor_id: item.actor_id || item.user_id || getActiveLocalProfileId() || null,
    action: String(item.action || 'local_change'),
    entity_type: String(item.entity_type || 'unknown'),
    entity_id: String(item.entity_id || item.id || ''),
    payload: item.payload || {},
    client_created_at: item.created_at || now(),
    device_id: localStorage.getItem('mizona-device-id') || 'web-local'
  };
}

export function getCloudSyncStatus() {
  const rows = listLocalSyncQueue();
  return {
    configured: hasSupabase,
    pending: rows.filter(row => ['local_only', 'pending', 'failed'].includes(row.status)).length,
    synced: rows.filter(row => row.status === 'synced').length,
    failed: rows.filter(row => row.status === 'failed').length,
    lastSyncAt: localStorage.getItem('mizona-last-cloud-sync') || null
  };
}

export async function syncLocalQueue({ limit = MAX_BATCH } = {}) {
  if (!hasSupabase || !supabase) {
    return { ok: false, reason: 'backend_not_configured', ...getCloudSyncStatus() };
  }
  if (!navigator.onLine) {
    return { ok: false, reason: 'offline', ...getCloudSyncStatus() };
  }

  const { data: auth } = await supabase.auth.getUser();
  const cloudUserId = auth?.user?.id || null;
  const pending = listLocalSyncQueue()
    .filter(row => ['local_only', 'pending', 'failed'].includes(row.status))
    .slice(0, Math.max(1, Number(limit) || MAX_BATCH));

  if (!pending.length) return { ok: true, uploaded: 0, ...getCloudSyncStatus() };

  const events = pending.map(item => ({ ...normalizeEvent(item), user_id: cloudUserId }));
  const { error } = await supabase
    .from('app_sync_events')
    .upsert(events, { onConflict: 'client_event_id' });

  if (error) {
    mutateLocalState(draft => {
      const ids = new Set(pending.map(item => item.id));
      draft.syncQueue = (draft.syncQueue || []).map(item => ids.has(item.id)
        ? { ...item, status: 'failed', sync_error: error.message, last_attempt_at: now() }
        : item);
    }, 'cloud-sync-failed');
    return { ok: false, reason: 'upload_failed', error: error.message, ...getCloudSyncStatus() };
  }

  mutateLocalState(draft => {
    const ids = new Set(pending.map(item => item.id));
    draft.syncQueue = (draft.syncQueue || []).map(item => ids.has(item.id)
      ? { ...item, status: 'synced', synced_at: now(), sync_error: null }
      : item);
  }, 'cloud-sync-success');

  localStorage.setItem('mizona-last-cloud-sync', now());
  return { ok: true, uploaded: pending.length, ...getCloudSyncStatus() };
}

export async function pullCloudEvents({ since, limit = 100 } = {}) {
  if (!hasSupabase || !supabase || !navigator.onLine) return { ok: false, events: [] };
  let query = supabase
    .from('app_sync_events')
    .select('id,client_event_id,local_actor_id,action,entity_type,entity_id,payload,client_created_at,created_at')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (since) query = query.gt('created_at', since);
  const { data, error } = await query;
  if (error) return { ok: false, events: [], error: error.message };
  return { ok: true, events: data || [] };
}

export function startAutomaticCloudSync({ intervalMs = 45000 } = {}) {
  let stopped = false;
  let timer = null;
  const run = async () => {
    if (stopped) return;
    try { await syncLocalQueue(); } catch {}
    if (!stopped) timer = window.setTimeout(run, intervalMs);
  };
  const onlineHandler = () => syncLocalQueue().catch(() => {});
  window.addEventListener('online', onlineHandler);
  timer = window.setTimeout(run, 3000);
  return () => {
    stopped = true;
    window.removeEventListener('online', onlineHandler);
    if (timer) window.clearTimeout(timer);
  };
}
