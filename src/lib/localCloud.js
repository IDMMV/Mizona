import { getActiveLocalProfile, listLocalProfiles, mutateLocalState, readLocalState, subscribeLocalData } from './localStore';

const CLOUD_KEY = 'mizona-v8-cloud-center-v25';
const CLOUD_EVENT = 'mizona-v8-cloud-center-change-v25';
const CHANNEL = 'mizona-v8-cloud-center-v25';
const MAX_LOCAL_FILE_MB = 25;

const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();
const clone = value => JSON.parse(JSON.stringify(value));

function seedCloudState() {
  return {
    version: 25,
    settings: {
      pushEnabled: false,
      browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      allowStudentPush: true,
      allowMarketingPush: false,
      digestFrequency: 'daily',
      emailFallback: true,
      whatsappFallback: false,
      smsFallback: false,
      requireFileScan: true,
      defaultRetentionDays: 7,
      maxFileMb: MAX_LOCAL_FILE_MB,
      quarantineDangerousFiles: true,
      storageProvider: 'supabase_storage_future',
      pushProvider: 'web_push_future'
    },
    templates: [
      { id: 'tpl-chat', type: 'chat', title: 'Nuevo mensaje', body: 'Tienes un nuevo mensaje en MiZona Chat.', enabled: true, audience: 'contactos' },
      { id: 'tpl-school', type: 'community', title: 'Comunicado escolar', body: 'Hay un nuevo aviso en tu comunidad escolar.', enabled: true, audience: 'estudiantes y padres' },
      { id: 'tpl-business', type: 'business', title: 'Pedido actualizado', body: 'Tu pedido cambió de estado.', enabled: true, audience: 'clientes y negocio' },
      { id: 'tpl-payments', type: 'payments', title: 'Pago protegido', body: 'Tu operación tiene un nuevo estado.', enabled: true, audience: 'compradores y vendedores' },
      { id: 'tpl-ride', type: 'ride', title: 'Viaje actualizado', body: 'Tu viaje o envío cambió de estado.', enabled: true, audience: 'pasajeros y conductores' }
    ],
    buckets: [
      { id: 'bucket-chat', name: 'chat-attachments', module: 'Chat', retentionDays: 7, encrypted: true, public: false, status: 'planned' },
      { id: 'bucket-transfer', name: 'transfer-tasks', module: 'Transfer', retentionDays: 30, encrypted: true, public: false, status: 'planned' },
      { id: 'bucket-business', name: 'business-receipts', module: 'Business', retentionDays: 365, encrypted: true, public: false, status: 'planned' },
      { id: 'bucket-verification', name: 'verification-documents', module: 'Verificación', retentionDays: 365, encrypted: true, public: false, status: 'planned' },
      { id: 'bucket-marketplace', name: 'marketplace-images', module: 'Marketplace', retentionDays: 180, encrypted: true, public: true, status: 'planned' }
    ],
    subscriptions: [],
    fcmTokens: [],
    files: [
      { id: 'file-demo-1', name: 'Acta_comite_julio.pdf', module: 'Comités', ownerId: 'local-user-jose', sizeBytes: 218000, mimeType: 'application/pdf', retentionDays: 30, scanStatus: 'clean', cloudStatus: 'local_only', createdAt: now(), expiresAt: futureDays(30), sharedWith: ['local-user-maria'] },
      { id: 'file-demo-2', name: 'Tarea_ciencias_Ian.docx', module: 'CampusHugo', ownerId: 'local-user-ian', sizeBytes: 92000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', retentionDays: 7, scanStatus: 'clean', cloudStatus: 'local_only', createdAt: now(), expiresAt: futureDays(7), sharedWith: ['local-user-ana'] }
    ],
    sends: [],
    uploadQueue: [],
    audit: [{ id: uid('audit'), action: 'cloud_center_seed', detail: 'Etapa 25 inicializada', createdAt: now() }],
    updatedAt: now()
  };
}

function futureDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString();
}

function normalize(state) {
  const seeded = seedCloudState();
  return {
    ...seeded,
    ...(state || {}),
    version: 25,
    settings: { ...seeded.settings, ...(state?.settings || {}) },
    templates: Array.isArray(state?.templates) && state.templates.length ? state.templates : seeded.templates,
    buckets: Array.isArray(state?.buckets) && state.buckets.length ? state.buckets : seeded.buckets,
    subscriptions: Array.isArray(state?.subscriptions) ? state.subscriptions : [],
    fcmTokens: Array.isArray(state?.fcmTokens) ? state.fcmTokens : [],
    files: Array.isArray(state?.files) && state.files.length ? state.files : seeded.files,
    sends: Array.isArray(state?.sends) ? state.sends : [],
    uploadQueue: Array.isArray(state?.uploadQueue) ? state.uploadQueue : [],
    audit: Array.isArray(state?.audit) ? state.audit : seeded.audit
  };
}

function notifyChange(reason = 'cloud-update') {
  window.dispatchEvent(new CustomEvent(CLOUD_EVENT, { detail: { reason } }));
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ reason, at: now() });
    channel.close();
  } catch {}
}

export function getCloudState() {
  try {
    const raw = localStorage.getItem(CLOUD_KEY);
    if (!raw) {
      const seeded = seedCloudState();
      localStorage.setItem(CLOUD_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return normalize(JSON.parse(raw));
  } catch {
    return seedCloudState();
  }
}

export function writeCloudState(next, reason = 'cloud-update') {
  const state = { ...normalize(next), updatedAt: now() };
  localStorage.setItem(CLOUD_KEY, JSON.stringify(state));
  notifyChange(reason);
  return state;
}

export function subscribeCloud(callback) {
  const handler = () => callback?.(getCloudState());
  const storage = event => { if (!event.key || event.key === CLOUD_KEY) handler(); };
  let channel = null;
  try { channel = new BroadcastChannel(CHANNEL); channel.addEventListener('message', handler); } catch {}
  window.addEventListener(CLOUD_EVENT, handler);
  window.addEventListener('storage', storage);
  const unsubLocal = subscribeLocalData(handler);
  return () => {
    window.removeEventListener(CLOUD_EVENT, handler);
    window.removeEventListener('storage', storage);
    if (channel) { channel.removeEventListener('message', handler); channel.close(); }
    unsubLocal?.();
  };
}

function audit(state, action, detail) {
  state.audit.unshift({ id: uid('audit'), action, detail, actorId: getActiveLocalProfile().id, createdAt: now() });
  state.audit = state.audit.slice(0, 300);
}

export function updateCloudSettings(values) {
  const state = getCloudState();
  state.settings = { ...state.settings, ...values };
  audit(state, 'settings_update', 'Configuración de notificaciones y archivos actualizada.');
  return writeCloudState(state, 'cloud-settings');
}

export async function requestBrowserPermission() {
  if (typeof Notification === 'undefined') {
    updateCloudSettings({ browserPermission: 'unsupported', pushEnabled: false });
    return 'unsupported';
  }
  const permission = await Notification.requestPermission();
  updateCloudSettings({ browserPermission: permission, pushEnabled: permission === 'granted' });
  return permission;
}

export function toggleTemplate(templateId) {
  const state = getCloudState();
  const tpl = state.templates.find(item => item.id === templateId);
  if (tpl) tpl.enabled = !tpl.enabled;
  audit(state, 'template_toggle', `${tpl?.title || templateId}: ${tpl?.enabled ? 'activado' : 'desactivado'}`);
  return writeCloudState(state, 'cloud-template');
}

export function upsertBucket(bucketId, values) {
  const state = getCloudState();
  const item = state.buckets.find(row => row.id === bucketId);
  if (item) Object.assign(item, values);
  audit(state, 'bucket_update', `${item?.name || bucketId} actualizado.`);
  return writeCloudState(state, 'cloud-bucket');
}

function simpleScan(file) {
  const name = String(file.name || '').toLowerCase();
  const dangerous = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.msi'].some(ext => name.endsWith(ext));
  if (dangerous) return 'quarantined';
  if (file.size > MAX_LOCAL_FILE_MB * 1024 * 1024) return 'too_large';
  return 'clean';
}

export async function registerLocalFile(file, { module = 'Transfer', retentionDays = 7, sharedWith = [] } = {}) {
  if (!file) throw new Error('Selecciona un archivo.');
  const state = getCloudState();
  const active = getActiveLocalProfile();
  const scanStatus = simpleScan(file);
  const record = {
    id: uid('file'),
    name: file.name,
    module,
    ownerId: active.id,
    sizeBytes: file.size,
    mimeType: file.type || 'application/octet-stream',
    retentionDays: Number(retentionDays || state.settings.defaultRetentionDays || 7),
    scanStatus,
    cloudStatus: scanStatus === 'clean' ? 'ready_for_cloud' : 'blocked',
    createdAt: now(),
    expiresAt: futureDays(retentionDays || state.settings.defaultRetentionDays || 7),
    sharedWith
  };
  state.files.unshift(record);
  state.uploadQueue.unshift({ id: uid('upload'), fileId: record.id, name: record.name, status: record.cloudStatus === 'ready_for_cloud' ? 'queued_local' : 'blocked', createdAt: now() });
  audit(state, 'file_register', `${record.name} · ${scanStatus}`);
  writeCloudState(state, 'cloud-file');
  mutateLocalState(draft => {
    draft.syncQueue.unshift({ id: uid('queue'), actor_id: active.id, action: 'file_cloud_prepare', entity_type: 'file', entity_id: record.id, payload: { name: record.name, module, scanStatus }, status: 'local_only', created_at: now() });
    draft.notifications.unshift({ id: uid('not'), user_id: active.id, type: 'system', title: 'Archivo preparado', body: `${record.name} quedó ${scanStatus === 'clean' ? 'listo para subir a la nube futura' : 'bloqueado para revisión'}.`, page: 'cloudCenter', read: false, created_at: now() });
  }, 'cloud-file-prepare');
  return record;
}

export function expireFile(fileId) {
  const state = getCloudState();
  const file = state.files.find(item => item.id === fileId);
  if (file) {
    file.cloudStatus = 'expired';
    file.expiresAt = now();
    audit(state, 'file_expire', file.name);
  }
  return writeCloudState(state, 'cloud-file-expire');
}

export function simulateSend({ templateId, userIds = [], channel = 'browser' }) {
  const state = getCloudState();
  const template = state.templates.find(item => item.id === templateId) || state.templates[0];
  const recipients = userIds.length ? userIds : listLocalProfiles().slice(0, 3).map(item => item.id);
  const send = { id: uid('send'), templateId: template.id, title: template.title, body: template.body, channel, recipients, status: 'simulated', createdAt: now() };
  state.sends.unshift(send);
  audit(state, 'notification_send_simulated', `${template.title} a ${recipients.length} usuario(s).`);
  writeCloudState(state, 'cloud-send');
  mutateLocalState(draft => {
    recipients.forEach(userId => draft.notifications.unshift({ id: uid('not'), user_id: userId, type: template.type || 'system', title: template.title, body: `${template.body} · Canal ${channel}`, page: 'notifications', read: false, created_at: now() }));
  }, 'cloud-notification-send');
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && channel === 'browser') {
    new Notification(template.title, { body: template.body });
  }
  return send;
}

export function getCloudSummary() {
  const state = getCloudState();
  const local = readLocalState();
  const files = state.files || [];
  const bytes = files.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0);
  return {
    state,
    profiles: local.directory?.length || 0,
    notifications: local.notifications?.length || 0,
    files: files.length,
    readyFiles: files.filter(item => item.cloudStatus === 'ready_for_cloud').length,
    blockedFiles: files.filter(item => item.cloudStatus === 'blocked').length,
    queuedUploads: state.uploadQueue.filter(item => item.status === 'queued_local').length,
    sends: state.sends.length,
    bytes
  };
}

export function downloadCloudReport() {
  const data = getCloudSummary();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mizona-etapa25-notificaciones-archivos-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
