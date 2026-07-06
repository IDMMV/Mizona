const STATE_KEY = 'mizona-v8-local-state-v13';
const PROFILE_KEY = 'mizona-v8-profile';
const CHANGE_EVENT = 'mizona:local-data-change';
const DB_NAME = 'mizona-v8-local-files';
const DB_VERSION = 1;
const FILE_STORE = 'files';

const now = Date.now();
const iso = value => new Date(value).toISOString();
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

const seedDirectory = [
  { id: 'local-ian', username: 'IAN_H', display_name: 'Ian Hugo', avatar_url: null, account_type: 'student', zone: 'Colegio San Martín' },
  { id: 'local-valery', username: 'VALERY_H', display_name: 'Valery Hugo', avatar_url: null, account_type: 'adult', zone: 'Ventanilla' },
  { id: 'local-dylan', username: 'DYLAN_VC', display_name: 'Dylan Vilca', avatar_url: null, account_type: 'student', zone: 'Colegio San Martín' },
  { id: 'local-maria', username: 'MARIA_COMITE', display_name: 'María Torres', avatar_url: null, account_type: 'adult', zone: 'Comité Los Pinos' },
  { id: 'local-carlos', username: 'CARLOS_2009', display_name: 'Carlos Mendoza', avatar_url: null, account_type: 'adult', zone: 'Pachacútec' }
];

const seedContacts = [seedDirectory[0], seedDirectory[1], seedDirectory[3]];
const seedRequests = [
  { id: 'req-local-dylan', other_user_id: 'local-dylan', username: 'DYLAN_VC', display_name: 'Dylan Vilca', avatar_url: null, account_type: 'student', direction: 'received', status: 'pending', created_at: iso(now - 45 * 60000) },
  { id: 'req-local-carlos', other_user_id: 'local-carlos', username: 'CARLOS_2009', display_name: 'Carlos Mendoza', avatar_url: null, account_type: 'adult', direction: 'sent', status: 'pending', created_at: iso(now - 3 * 3600000) }
];

const seedConversations = [
  { id: 'conv-family', type: 'group', title: 'Familia Hugo', member_ids: ['local-ian','local-valery'], retention_days: 7, last_message_at: iso(now - 5 * 60000), updated_at: iso(now - 5 * 60000), unread_count: 2, last_message: 'Nos vemos a las 6:00 p. m.' },
  { id: 'conv-ian', type: 'direct', title: null, peer_id: 'local-ian', peer_username: 'IAN_H', peer_display_name: 'Ian Hugo', retention_days: 7, last_message_at: iso(now - 30 * 60000), updated_at: iso(now - 30 * 60000), unread_count: 0, last_message: 'Ya envié la tarea.' },
  { id: 'conv-school', type: 'school_room', title: '5.º A · Ciencia', member_ids: ['local-ian','local-dylan'], community_id: 'san-martin', room_id: '5a', retention_days: 7, last_message_at: iso(now - 2 * 3600000), updated_at: iso(now - 2 * 3600000), unread_count: 4, last_message: 'Adjunto la guía de laboratorio.' }
];

const seedMessages = {
  'conv-family': [
    { id: 'm-local-1', sender_id: 'local-valery', sender_username: 'VALERY_H', sender_display_name: 'Valery Hugo', body: '¿A qué hora salimos?', message_type: 'text', created_at: iso(now - 30 * 60000), expires_at: iso(now + 6 * 86400000), attachments: [] },
    { id: 'm-local-2', sender_id: 'local-user-jose', sender_username: 'JOSE1985', sender_display_name: 'José', body: 'Nos vemos a las 6:00 p. m.', message_type: 'text', created_at: iso(now - 5 * 60000), expires_at: iso(now + 7 * 86400000), attachments: [] }
  ],
  'conv-ian': [
    { id: 'm-local-3', sender_id: 'local-ian', sender_username: 'IAN_H', sender_display_name: 'Ian Hugo', body: 'Ya envié la tarea.', message_type: 'text', created_at: iso(now - 30 * 60000), expires_at: iso(now + 6 * 86400000), attachments: [] }
  ],
  'conv-school': [
    { id: 'm-local-4', sender_id: 'local-teacher', sender_username: 'PROFE_ANA', sender_display_name: 'Profesora Ana', body: 'Adjunto la guía de laboratorio.', message_type: 'file', created_at: iso(now - 2 * 3600000), expires_at: iso(now + 5 * 86400000), attachments: [{ id: 'a-local-demo', file_name: 'guia_laboratorio.pdf', mime_type: 'application/pdf', size_bytes: 284000, storage_path: null }] }
  ]
};

const seedNotifications = [
  { id: 'not-local-mode', type: 'system', title: 'Modo local activado', body: 'MiZona seguirá funcionando en este dispositivo mientras Supabase se recupera.', page: 'settings', read: false, created_at: iso(now - 2 * 60000) },
  { id: 'not-request', type: 'chat', title: 'Nueva solicitud de contacto', body: 'DYLAN_VC quiere agregarte a MiZona Chat.', page: 'chat', read: false, created_at: iso(now - 45 * 60000) },
  { id: 'not-school', type: 'community', title: 'Comunicado escolar', body: 'Reunión de padres hoy a las 7:00 p. m.', page: 'community', read: false, created_at: iso(now - 2 * 3600000) },
  { id: 'not-benefit', type: 'benefit', title: 'Beneficio cerca de ti', body: 'Nuevo descuento familiar disponible en Pachacútec.', page: 'benefits', read: true, created_at: iso(now - 5 * 3600000) }
];

const seedReports = [
  { id: 'report-local-1', reporter_id: 'local-user-jose', conversation_id: 'conv-school', message_id: 'm-local-4', reported_user_id: 'local-teacher', reason: 'Contenido por revisar', details: 'Ejemplo de flujo local de moderación.', status: 'pending', created_at: iso(now - 90 * 60000), source: 'local' }
];

function seedState() {
  return {
    version: 13,
    mode: 'local',
    directory: seedDirectory,
    contacts: seedContacts,
    requests: seedRequests,
    conversations: seedConversations,
    messages: seedMessages,
    blockedUsers: [],
    reports: seedReports,
    notifications: seedNotifications,
    syncQueue: [],
    auditLogs: [
      { id: 'audit-start', action: 'local_mode_started', entity_type: 'system', entity_id: 'stage13', created_at: iso(now - 2 * 60000), detail: 'Etapa 13 iniciada en modo local.' }
    ],
    preferences: { community: true, chat: true, offers: true, courses: false, ride: true },
    updatedAt: iso(now)
  };
}

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function readLocalState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) {
      const seeded = seedState();
      localStorage.setItem(STATE_KEY, JSON.stringify(seeded));
      return clone(seeded);
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 13) {
      const seeded = seedState();
      localStorage.setItem(STATE_KEY, JSON.stringify(seeded));
      return clone(seeded);
    }
    return parsed;
  } catch {
    return seedState();
  }
}

export function writeLocalState(nextState, reason = 'update') {
  const next = { ...nextState, version: 13, mode: 'local', updatedAt: new Date().toISOString() };
  localStorage.setItem(STATE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason, state: next } }));
  return next;
}

export function mutateLocalState(mutator, reason = 'update') {
  const current = readLocalState();
  const draft = clone(current);
  const returned = mutator(draft);
  return writeLocalState(returned || draft, reason);
}

export function subscribeLocalData(callback) {
  const handler = event => callback?.(event.detail || {});
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function readProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') || {};
    return {
      id: stored.id || 'local-user-jose',
      username: String(stored.username || 'JOSE1985').toUpperCase(),
      displayName: stored.displayName || 'José'
    };
  } catch {
    return { id: 'local-user-jose', username: 'JOSE1985', displayName: 'José' };
  }
}

function addAudit(draft, action, entityType, entityId, detail = '') {
  draft.auditLogs.unshift({ id: uid('audit'), action, entity_type: entityType, entity_id: entityId, detail, created_at: new Date().toISOString() });
  draft.auditLogs = draft.auditLogs.slice(0, 300);
}

function enqueue(draft, action, entityType, entityId, payload = {}) {
  draft.syncQueue.unshift({ id: uid('queue'), action, entity_type: entityType, entity_id: entityId, payload, status: 'local_only', created_at: new Date().toISOString() });
  draft.syncQueue = draft.syncQueue.slice(0, 500);
}

function pushNotification(draft, notification) {
  draft.notifications.unshift({
    id: uid('not'),
    type: notification.type || 'system',
    title: notification.title || 'MiZona',
    body: notification.body || '',
    page: notification.page || 'notifications',
    read: false,
    created_at: new Date().toISOString()
  });
  draft.notifications = draft.notifications.slice(0, 200);
}

export function getLocalChatContacts() {
  return readLocalState().contacts.filter(item => !readLocalState().blockedUsers.includes(item.id));
}

export function getLocalChatRequests() {
  return readLocalState().requests;
}

export function getLocalConversations() {
  return [...readLocalState().conversations].sort((a, b) => new Date(b.last_message_at || b.updated_at || 0) - new Date(a.last_message_at || a.updated_at || 0));
}

export function getLocalMessages(conversationId) {
  const state = readLocalState();
  const currentTime = Date.now();
  return (state.messages[conversationId] || []).filter(message => !message.expires_at || new Date(message.expires_at).getTime() > currentTime);
}

export function findLocalProfileExact(username) {
  const normalized = String(username || '').trim().toUpperCase();
  const state = readLocalState();
  const profile = readProfile();
  if (normalized === profile.username) return null;
  return state.directory.find(item => String(item.username).toUpperCase() === normalized && !state.blockedUsers.includes(item.id)) || null;
}

export function sendLocalContactRequest(username) {
  const target = findLocalProfileExact(username);
  if (!target) throw new Error('No se encontró un usuario disponible con ese nombre exacto.');
  const state = readLocalState();
  if (state.contacts.some(item => item.id === target.id)) throw new Error('Ese usuario ya está en tus contactos.');
  if (state.requests.some(item => item.other_user_id === target.id && item.status === 'pending')) throw new Error('Ya existe una solicitud pendiente con ese usuario.');
  const requestId = uid('req');
  mutateLocalState(draft => {
    draft.requests.unshift({ id: requestId, other_user_id: target.id, username: target.username, display_name: target.display_name, avatar_url: target.avatar_url, account_type: target.account_type, direction: 'sent', status: 'pending', created_at: new Date().toISOString() });
    enqueue(draft, 'contact_request_create', 'contact_request', requestId, { target_id: target.id });
    addAudit(draft, 'contact_request_create', 'contact_request', requestId, `Solicitud enviada a @${target.username}`);
  }, 'contact-request');
  return requestId;
}

export function reviewLocalContactRequest(requestId, action) {
  const allowed = ['accepted', 'rejected'];
  if (!allowed.includes(action)) throw new Error('Acción de solicitud inválida.');
  mutateLocalState(draft => {
    const request = draft.requests.find(item => item.id === requestId);
    if (!request) throw new Error('La solicitud ya no existe.');
    request.status = action;
    request.reviewed_at = new Date().toISOString();
    if (action === 'accepted') {
      const target = draft.directory.find(item => item.id === request.other_user_id);
      if (target && !draft.contacts.some(item => item.id === target.id)) draft.contacts.push(target);
      pushNotification(draft, { type: 'chat', title: 'Contacto aceptado', body: `${request.display_name} ahora forma parte de tus contactos.`, page: 'chat' });
    }
    enqueue(draft, 'contact_request_review', 'contact_request', requestId, { action });
    addAudit(draft, 'contact_request_review', 'contact_request', requestId, action);
  }, 'contact-request-review');
  return action;
}

export function blockLocalUser(userId, reason = '') {
  mutateLocalState(draft => {
    if (!draft.blockedUsers.includes(userId)) draft.blockedUsers.push(userId);
    draft.contacts = draft.contacts.filter(item => item.id !== userId);
    draft.requests = draft.requests.filter(item => item.other_user_id !== userId);
    const removedConversationIds = draft.conversations.filter(item => item.type === 'direct' && item.peer_id === userId).map(item => item.id);
    draft.conversations = draft.conversations.filter(item => !removedConversationIds.includes(item.id));
    removedConversationIds.forEach(id => delete draft.messages[id]);
    enqueue(draft, 'user_block', 'profile', userId, { reason });
    addAudit(draft, 'user_block', 'profile', userId, reason || 'Sin motivo registrado');
  }, 'user-block');
  return true;
}

export function unblockLocalUser(userId) {
  mutateLocalState(draft => {
    draft.blockedUsers = draft.blockedUsers.filter(id => id !== userId);
    enqueue(draft, 'user_unblock', 'profile', userId);
    addAudit(draft, 'user_unblock', 'profile', userId);
  }, 'user-unblock');
  return true;
}

export function startLocalDirectConversation(targetId) {
  const state = readLocalState();
  const existing = state.conversations.find(item => item.type === 'direct' && item.peer_id === targetId);
  if (existing) return existing.id;
  const target = state.directory.find(item => item.id === targetId) || state.contacts.find(item => item.id === targetId);
  if (!target) throw new Error('El contacto no está disponible.');
  const conversationId = uid('conv-direct');
  mutateLocalState(draft => {
    draft.conversations.unshift({ id: conversationId, type: 'direct', title: null, peer_id: target.id, peer_username: target.username, peer_display_name: target.display_name, peer_avatar_url: target.avatar_url, retention_days: 7, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString(), unread_count: 0, last_message: 'Conversación nueva' });
    draft.messages[conversationId] = [];
    enqueue(draft, 'conversation_create', 'conversation', conversationId, { type: 'direct', target_id: targetId });
    addAudit(draft, 'conversation_create', 'conversation', conversationId, `Chat directo con @${target.username}`);
  }, 'conversation-create');
  return conversationId;
}

export function createLocalGroup({ title, memberIds = [], communityId = null, roomId = null }) {
  const cleanTitle = String(title || '').trim();
  if (cleanTitle.length < 3) throw new Error('El nombre del grupo debe tener al menos 3 caracteres.');
  const conversationId = uid('conv-group');
  const type = communityId ? (roomId ? 'school_room' : 'school_group') : 'group';
  mutateLocalState(draft => {
    draft.conversations.unshift({ id: conversationId, type, title: cleanTitle, member_ids: memberIds, community_id: communityId, room_id: roomId, retention_days: 7, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString(), unread_count: 0, last_message: 'Grupo creado en modo local' });
    draft.messages[conversationId] = [];
    enqueue(draft, 'conversation_create', 'conversation', conversationId, { type, member_ids: memberIds, community_id: communityId, room_id: roomId });
    addAudit(draft, 'conversation_create', 'conversation', conversationId, cleanTitle);
    pushNotification(draft, { type: 'chat', title: 'Grupo creado', body: `${cleanTitle} está disponible en este dispositivo.`, page: 'chat' });
  }, 'group-create');
  return conversationId;
}

export function sendLocalTextMessage(conversationId, body, replyTo = null) {
  const cleanBody = String(body || '').trim();
  if (!cleanBody) throw new Error('Escribe un mensaje.');
  const profile = readProfile();
  const messageId = uid('msg');
  const createdAt = new Date().toISOString();
  mutateLocalState(draft => {
    const conversation = draft.conversations.find(item => item.id === conversationId);
    if (!conversation) throw new Error('La conversación no existe en este dispositivo.');
    const message = { id: messageId, sender_id: profile.id, sender_username: profile.username, sender_display_name: profile.displayName, body: cleanBody, message_type: 'text', reply_to: replyTo, created_at: createdAt, expires_at: new Date(Date.now() + (conversation.retention_days || 7) * 86400000).toISOString(), attachments: [], sync_status: 'local_only' };
    if (!draft.messages[conversationId]) draft.messages[conversationId] = [];
    draft.messages[conversationId].push(message);
    conversation.last_message = cleanBody;
    conversation.last_message_at = createdAt;
    conversation.updated_at = createdAt;
    conversation.unread_count = 0;
    enqueue(draft, 'message_create', 'chat_message', messageId, { conversation_id: conversationId, body: cleanBody });
    addAudit(draft, 'message_create', 'chat_message', messageId, `Conversación ${conversationId}`);
  }, 'message-create');
  return messageId;
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('Este navegador no permite guardar archivos locales.'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento local.'));
  });
}

async function idbTransaction(mode, runner) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, mode);
    const store = tx.objectStore(FILE_STORE);
    let result;
    try { result = runner(store); } catch (error) { db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Error en almacenamiento local.')); };
  });
}

export async function putLocalFile(fileId, file) {
  await idbTransaction('readwrite', store => store.put({ id: fileId, blob: file, name: file.name, type: file.type || 'application/octet-stream', size: file.size, created_at: new Date().toISOString() }));
}

export async function getLocalFile(fileId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly');
    const request = tx.objectStore(FILE_STORE).get(fileId);
    request.onsuccess = () => { db.close(); resolve(request.result || null); };
    request.onerror = () => { db.close(); reject(request.error || new Error('No se pudo leer el archivo local.')); };
  });
}

export async function deleteLocalFile(fileId) {
  await idbTransaction('readwrite', store => store.delete(fileId));
}

export async function sendLocalChatFile({ conversationId, file }) {
  if (!file) throw new Error('Selecciona un archivo.');
  if (file.size > 25 * 1024 * 1024) throw new Error('El archivo supera el máximo local de 25 MB.');
  const profile = readProfile();
  const messageId = uid('msg-file');
  const fileId = uid('file');
  await putLocalFile(fileId, file);
  const createdAt = new Date().toISOString();
  mutateLocalState(draft => {
    const conversation = draft.conversations.find(item => item.id === conversationId);
    if (!conversation) throw new Error('La conversación no existe.');
    const attachment = { id: uid('attachment'), file_name: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size, storage_path: `local:${fileId}`, local_file_id: fileId };
    const message = { id: messageId, sender_id: profile.id, sender_username: profile.username, sender_display_name: profile.displayName, body: file.name, message_type: String(file.type || '').startsWith('image/') ? 'image' : 'file', created_at: createdAt, expires_at: new Date(Date.now() + (conversation.retention_days || 7) * 86400000).toISOString(), attachments: [attachment], sync_status: 'local_only' };
    if (!draft.messages[conversationId]) draft.messages[conversationId] = [];
    draft.messages[conversationId].push(message);
    conversation.last_message = `📎 ${file.name}`;
    conversation.last_message_at = createdAt;
    conversation.updated_at = createdAt;
    enqueue(draft, 'file_message_create', 'chat_message', messageId, { conversation_id: conversationId, file_name: file.name, size: file.size });
    addAudit(draft, 'file_message_create', 'chat_message', messageId, file.name);
  }, 'file-message-create');
  return messageId;
}

export async function openLocalAttachment(storagePath) {
  const fileId = String(storagePath || '').replace(/^local:/, '');
  const record = await getLocalFile(fileId);
  if (!record?.blob) throw new Error('El archivo local ya no está disponible en este dispositivo.');
  const url = URL.createObjectURL(record.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = record.name || 'archivo';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
  return true;
}

export function markLocalConversationRead(conversationId) {
  mutateLocalState(draft => {
    const conversation = draft.conversations.find(item => item.id === conversationId);
    if (conversation) conversation.unread_count = 0;
  }, 'conversation-read');
  return true;
}

export function leaveLocalConversation(conversationId) {
  mutateLocalState(draft => {
    draft.conversations = draft.conversations.filter(item => item.id !== conversationId);
    delete draft.messages[conversationId];
    enqueue(draft, 'conversation_leave', 'conversation', conversationId);
    addAudit(draft, 'conversation_leave', 'conversation', conversationId);
  }, 'conversation-leave');
  return true;
}

export function reportLocalChatItem({ conversationId, messageId = null, reportedUserId = null, reason, details = '', reporterId = null }) {
  const reportId = uid('report');
  mutateLocalState(draft => {
    draft.reports.unshift({ id: reportId, reporter_id: reporterId || readProfile().id, conversation_id: conversationId, message_id: messageId, reported_user_id: reportedUserId, reason: String(reason || 'Otro'), details: details || '', status: 'pending', created_at: new Date().toISOString(), source: 'local' });
    enqueue(draft, 'report_create', 'chat_report', reportId, { conversation_id: conversationId, message_id: messageId, reason });
    addAudit(draft, 'report_create', 'chat_report', reportId, reason);
    pushNotification(draft, { type: 'moderation', title: 'Reporte registrado', body: 'El reporte quedó guardado para revisión en el Centro de Control.', page: 'admin' });
  }, 'report-create');
  return reportId;
}

export function listLocalReports() {
  return readLocalState().reports;
}

export function reviewLocalReport(reportId, status, reviewerId = null) {
  const allowed = ['pending','reviewing','resolved','dismissed'];
  if (!allowed.includes(status)) throw new Error('Estado de reporte inválido.');
  mutateLocalState(draft => {
    const report = draft.reports.find(item => item.id === reportId);
    if (!report) throw new Error('El reporte no existe.');
    report.status = status;
    report.reviewed_at = new Date().toISOString();
    report.reviewed_by = reviewerId || readProfile().id;
    addAudit(draft, 'report_review', 'chat_report', reportId, status);
    pushNotification(draft, { type: 'moderation', title: 'Reporte actualizado', body: `El reporte pasó al estado ${status}.`, page: 'admin' });
  }, 'report-review');
  return true;
}

export function listLocalNotifications() {
  return readLocalState().notifications;
}

export function unreadLocalNotifications() {
  return readLocalState().notifications.filter(item => !item.read).length;
}

export function markLocalNotification(notificationId, read = true) {
  mutateLocalState(draft => {
    const item = draft.notifications.find(notification => notification.id === notificationId);
    if (item) item.read = read;
  }, 'notification-read');
}

export function markAllLocalNotificationsRead() {
  mutateLocalState(draft => { draft.notifications.forEach(item => { item.read = true; }); }, 'notifications-read-all');
}

export function deleteLocalNotification(notificationId) {
  mutateLocalState(draft => { draft.notifications = draft.notifications.filter(item => item.id !== notificationId); }, 'notification-delete');
}

export function listLocalAuditLogs() {
  return readLocalState().auditLogs;
}

export function listLocalSyncQueue() {
  return readLocalState().syncQueue;
}

export function getLocalStats() {
  const state = readLocalState();
  return {
    contacts: state.contacts.length,
    conversations: state.conversations.length,
    messages: Object.values(state.messages).reduce((total, rows) => total + rows.length, 0),
    reportsPending: state.reports.filter(item => item.status === 'pending').length,
    notificationsUnread: state.notifications.filter(item => !item.read).length,
    syncPending: state.syncQueue.filter(item => item.status === 'local_only').length,
    blocked: state.blockedUsers.length,
    updatedAt: state.updatedAt
  };
}

export function getLocalPreferences() {
  return readLocalState().preferences;
}

export function saveLocalPreferences(preferences) {
  mutateLocalState(draft => {
    draft.preferences = { ...draft.preferences, ...preferences };
    addAudit(draft, 'preferences_update', 'preferences', 'local', JSON.stringify(preferences));
  }, 'preferences-update');
  return true;
}

export function exportLocalBackup() {
  const payload = {
    exported_at: new Date().toISOString(),
    app: 'MiZona Enterprise V8',
    stage: 13,
    state: readLocalState()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `mizona-respaldo-local-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function importLocalBackup(file) {
  if (!file) throw new Error('Selecciona un respaldo JSON.');
  const text = await file.text();
  const parsed = JSON.parse(text);
  const state = parsed?.state || parsed;
  if (!state || !Array.isArray(state.conversations) || !state.messages || !Array.isArray(state.notifications)) throw new Error('El archivo no contiene un respaldo válido de MiZona.');
  state.version = 13;
  writeLocalState(state, 'backup-import');
  return true;
}

export function resetLocalData() {
  localStorage.setItem(STATE_KEY, JSON.stringify(seedState()));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason: 'reset', state: readLocalState() } }));
}

export async function cleanupExpiredLocalData() {
  const state = readLocalState();
  const expiredFileIds = [];
  const currentTime = Date.now();
  let removed = 0;
  Object.entries(state.messages).forEach(([conversationId, rows]) => {
    state.messages[conversationId] = rows.filter(message => {
      const expired = message.expires_at && new Date(message.expires_at).getTime() <= currentTime;
      if (expired) {
        removed += 1;
        (message.attachments || []).forEach(attachment => {
          if (String(attachment.storage_path || '').startsWith('local:')) expiredFileIds.push(String(attachment.storage_path).replace(/^local:/, ''));
        });
      }
      return !expired;
    });
  });
  if (removed) {
    addAudit(state, 'retention_cleanup', 'chat_message', String(removed), `${removed} mensajes vencidos eliminados`);
    writeLocalState(state, 'retention-cleanup');
  }
  await Promise.allSettled(expiredFileIds.map(deleteLocalFile));
  return { removedMessages: removed, removedFiles: expiredFileIds.length };
}

export function isLocalDataMode() {
  return localStorage.getItem('mizona-v8-data-mode-v13') !== 'cloud' || !navigator.onLine;
}
