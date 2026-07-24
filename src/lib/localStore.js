const STATE_KEY = 'mizona-v8-local-state-v14';
const LEGACY_STATE_KEY = 'mizona-v8-local-state-v13';
const PROFILE_KEY = 'mizona-v8-profile';
const ACTIVE_PROFILE_KEY = 'mizona-v8-active-local-profile-v14';
const CHANGE_EVENT = 'mizona:local-data-change';
const PROFILE_EVENT = 'mizona:local-profile-change';
const CHANNEL_NAME = 'mizona-v8-local-v14';
const DB_NAME = 'mizona-v8-local-files';
const DB_VERSION = 1;
const FILE_STORE = 'files';

const now = Date.now();
const iso = value => new Date(value).toISOString();
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const pairKey = (a, b) => [a, b].sort().join('::');
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

const seedDirectory = [
  { id: 'local-user-jose', username: 'JOSE1985', display_name: 'José', avatar_url: null, account_type: 'adult', role: 'super_admin', zone: 'Ventanilla - Pachacútec', school_id: 'san-martin', school_role: 'parent', status: 'active', builtin: true },
  { id: 'local-ian', username: 'IAN_H', display_name: 'Ian Hugo', avatar_url: null, account_type: 'student', role: 'user', zone: 'Colegio San Martín', school_id: 'san-martin', school_role: 'student', status: 'active', builtin: true },
  { id: 'local-valery', username: 'VALERY_H', display_name: 'Valery Hugo', avatar_url: null, account_type: 'adult', role: 'user', zone: 'Ventanilla', school_id: null, school_role: null, status: 'active', builtin: true },
  { id: 'local-dylan', username: 'DYLAN_VC', display_name: 'Dylan Vilca', avatar_url: null, account_type: 'student', role: 'user', zone: 'Colegio San Martín', school_id: 'san-martin', school_role: 'student', status: 'active', builtin: true },
  { id: 'local-maria', username: 'MARIA_COMITE', display_name: 'María Torres', avatar_url: null, account_type: 'adult', role: 'admin', zone: 'Comité Los Pinos', school_id: null, school_role: null, status: 'active', builtin: true },
  { id: 'local-carlos', username: 'CARLOS_2009', display_name: 'Carlos Mendoza', avatar_url: null, account_type: 'adult', role: 'user', zone: 'Pachacútec', school_id: null, school_role: null, status: 'active', builtin: true },
  { id: 'local-teacher', username: 'PROFE_ANA', display_name: 'Profesora Ana', avatar_url: null, account_type: 'adult', role: 'user', zone: 'Colegio San Martín', school_id: 'san-martin', school_role: 'teacher', status: 'active', builtin: true }
];

function seedState() {
  return {
    version: 14,
    mode: 'local',
    directory: clone(seedDirectory),
    contactPairs: [
      { id: 'contact-jose-ian', user_a: 'local-user-jose', user_b: 'local-ian', created_at: iso(now - 30 * 86400000) },
      { id: 'contact-jose-valery', user_a: 'local-user-jose', user_b: 'local-valery', created_at: iso(now - 20 * 86400000) },
      { id: 'contact-jose-maria', user_a: 'local-user-jose', user_b: 'local-maria', created_at: iso(now - 10 * 86400000) }
    ],
    requests: [
      { id: 'req-local-dylan', sender_id: 'local-dylan', receiver_id: 'local-user-jose', status: 'pending', created_at: iso(now - 45 * 60000) },
      { id: 'req-local-carlos', sender_id: 'local-user-jose', receiver_id: 'local-carlos', status: 'pending', created_at: iso(now - 3 * 3600000) }
    ],
    conversations: [
      { id: 'conv-family', type: 'group', title: 'Familia Hugo', participant_ids: ['local-user-jose','local-ian','local-valery'], creator_id: 'local-user-jose', retention_days: 7, last_message_at: iso(now - 5 * 60000), updated_at: iso(now - 5 * 60000), unread_by: { 'local-user-jose': 2, 'local-ian': 0, 'local-valery': 1 }, last_message: 'Nos vemos a las 6:00 p. m.' },
      { id: 'conv-ian', type: 'direct', title: null, participant_ids: ['local-user-jose','local-ian'], creator_id: 'local-user-jose', retention_days: 7, last_message_at: iso(now - 30 * 60000), updated_at: iso(now - 30 * 60000), unread_by: { 'local-user-jose': 0, 'local-ian': 1 }, last_message: 'Ya envié la tarea.' },
      { id: 'conv-school', type: 'school_room', title: '5.º A · Ciencia', participant_ids: ['local-user-jose','local-ian','local-dylan','local-teacher'], creator_id: 'local-teacher', community_id: 'san-martin', room_id: '5a', retention_days: 7, last_message_at: iso(now - 2 * 3600000), updated_at: iso(now - 2 * 3600000), unread_by: { 'local-user-jose': 4, 'local-ian': 3, 'local-dylan': 2, 'local-teacher': 0 }, last_message: 'Adjunto la guía de laboratorio.' }
    ],
    messages: {
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
    },
    blocks: [],
    reports: [
      { id: 'report-local-1', reporter_id: 'local-user-jose', conversation_id: 'conv-school', message_id: 'm-local-4', reported_user_id: 'local-teacher', reason: 'Contenido por revisar', details: 'Ejemplo de flujo local de moderación.', status: 'pending', created_at: iso(now - 90 * 60000), source: 'local' }
    ],
    notifications: [
      { id: 'not-local-mode', user_id: 'local-user-jose', type: 'system', title: 'Laboratorio multiusuario activo', body: 'Puedes abrir dos pestañas y usar un perfil distinto en cada una.', page: 'localLab', read: false, created_at: iso(now - 2 * 60000) },
      { id: 'not-request', user_id: 'local-user-jose', type: 'chat', title: 'Nueva solicitud de contacto', body: 'DYLAN_VC quiere agregarte a MiZona Chat.', page: 'chat', read: false, created_at: iso(now - 45 * 60000) },
      { id: 'not-school', user_id: 'local-user-jose', type: 'community', title: 'Comunicado escolar', body: 'Reunión de padres hoy a las 7:00 p. m.', page: 'community', read: false, created_at: iso(now - 2 * 3600000) },
      { id: 'not-ian-chat', user_id: 'local-ian', type: 'chat', title: 'Mensaje de José', body: 'Nos vemos a las 6:00 p. m.', page: 'chat', read: false, created_at: iso(now - 5 * 60000) }
    ],
    syncQueue: [],
    auditLogs: [
      { id: 'audit-start', actor_id: 'local-user-jose', action: 'local_multiuser_started', entity_type: 'system', entity_id: 'stage14', created_at: iso(now - 2 * 60000), detail: 'Etapa 14 iniciada en laboratorio multiusuario local.' }
    ],
    preferencesByUser: {
      'local-user-jose': { community: true, chat: true, offers: true, courses: false, ride: true }
    },
    updatedAt: iso(now)
  };
}

function normalizeProfile(profile) {
  return {
    id: profile.id,
    username: String(profile.username || '').trim().toUpperCase(),
    display_name: profile.display_name || profile.displayName || 'Usuario local',
    avatar_url: profile.avatar_url || profile.avatarUrl || null,
    account_type: profile.account_type || profile.accountType || 'adult',
    role: profile.role || 'user',
    zone: profile.zone || 'Sin zona definida',
    school_id: profile.school_id || null,
    school_role: profile.school_role || null,
    status: profile.status || 'active',
    builtin: Boolean(profile.builtin),
    created_at: profile.created_at || new Date().toISOString()
  };
}

function migrateLegacyState(legacy) {
  const seeded = seedState();
  if (!legacy || typeof legacy !== 'object') return seeded;
  const directory = [seedDirectory[0], ...(Array.isArray(legacy.directory) ? legacy.directory : [])]
    .map(normalizeProfile)
    .filter((item, index, rows) => rows.findIndex(row => row.id === item.id) === index);
  const contacts = Array.isArray(legacy.contacts) ? legacy.contacts : [];
  const contactPairs = contacts.map(contact => ({ id: uid('contact-migrated'), user_a: 'local-user-jose', user_b: contact.id, created_at: new Date().toISOString() }));
  const requests = (Array.isArray(legacy.requests) ? legacy.requests : []).map(request => ({
    id: request.id || uid('req-migrated'),
    sender_id: request.direction === 'received' ? request.other_user_id : 'local-user-jose',
    receiver_id: request.direction === 'received' ? 'local-user-jose' : request.other_user_id,
    status: request.status || 'pending',
    created_at: request.created_at || new Date().toISOString(),
    reviewed_at: request.reviewed_at || null
  }));
  const conversations = (Array.isArray(legacy.conversations) ? legacy.conversations : []).map(item => ({
    ...item,
    participant_ids: Array.from(new Set(['local-user-jose', ...(item.participant_ids || item.member_ids || (item.peer_id ? [item.peer_id] : []))])),
    unread_by: item.unread_by || { 'local-user-jose': Number(item.unread_count || 0) }
  }));
  const notifications = (Array.isArray(legacy.notifications) ? legacy.notifications : []).map(item => ({ ...item, user_id: item.user_id || 'local-user-jose' }));
  return {
    ...seeded,
    directory,
    contactPairs: contactPairs.length ? contactPairs : seeded.contactPairs,
    requests,
    conversations,
    messages: legacy.messages || seeded.messages,
    reports: Array.isArray(legacy.reports) ? legacy.reports : seeded.reports,
    notifications,
    syncQueue: Array.isArray(legacy.syncQueue) ? legacy.syncQueue : [],
    auditLogs: Array.isArray(legacy.auditLogs) ? legacy.auditLogs : seeded.auditLogs,
    preferencesByUser: { 'local-user-jose': legacy.preferences || seeded.preferencesByUser['local-user-jose'] },
    updatedAt: legacy.updatedAt || new Date().toISOString()
  };
}

function getChannel() {
  try {
    return typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
  } catch {
    return null;
  }
}

function normalizeLocalState(value) {
  const seeded = seedState();
  const source = value && typeof value === 'object' ? value : {};
  const arrayKeys = ['directory', 'contactPairs', 'requests', 'conversations', 'blocks', 'reports', 'notifications', 'syncQueue', 'auditLogs'];
  const normalized = { ...seeded, ...source, version: 14, mode: 'local' };

  arrayKeys.forEach(key => {
    normalized[key] = Array.isArray(source[key]) ? source[key] : clone(seeded[key]);
  });

  normalized.messages = source.messages && typeof source.messages === 'object' && !Array.isArray(source.messages)
    ? source.messages
    : clone(seeded.messages);
  normalized.preferencesByUser = source.preferencesByUser && typeof source.preferencesByUser === 'object' && !Array.isArray(source.preferencesByUser)
    ? source.preferencesByUser
    : clone(seeded.preferencesByUser);

  if (!normalized.directory.length) normalized.directory = clone(seeded.directory);
  return normalized;
}

export function readLocalState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 14) {
        const normalized = normalizeLocalState(parsed);
        // Repara automáticamente datos incompletos guardados por versiones anteriores.
        if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
          localStorage.setItem(STATE_KEY, JSON.stringify(normalized));
        }
        return clone(normalized);
      }
    }
    const legacyRaw = localStorage.getItem(LEGACY_STATE_KEY);
    const migrated = normalizeLocalState(legacyRaw ? migrateLegacyState(JSON.parse(legacyRaw)) : seedState());
    localStorage.setItem(STATE_KEY, JSON.stringify(migrated));
    return clone(migrated);
  } catch (error) {
    console.warn('MiZona reparó el almacenamiento local dañado.', error);
    const repaired = normalizeLocalState(seedState());
    try { localStorage.setItem(STATE_KEY, JSON.stringify(repaired)); } catch {}
    return repaired;
  }
}

export function writeLocalState(nextState, reason = 'update') {
  const next = { ...nextState, version: 14, mode: 'local', updatedAt: new Date().toISOString() };
  localStorage.setItem(STATE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason, state: next } }));
  const channel = getChannel();
  channel?.postMessage({ reason, updatedAt: next.updatedAt });
  channel?.close();
  return next;
}

export function mutateLocalState(mutator, reason = 'update') {
  const draft = clone(readLocalState());
  const returned = mutator(draft);
  return writeLocalState(returned || draft, reason);
}

export function subscribeLocalData(callback) {
  const handler = event => callback?.(event.detail || { reason: 'storage' });
  const storageHandler = event => {
    if (!event.key || event.key === STATE_KEY) callback?.({ reason: 'storage' });
  };
  const profileHandler = event => callback?.(event.detail || { reason: 'profile-switch' });
  const channel = getChannel();
  const channelHandler = event => callback?.(event.data || { reason: 'broadcast' });
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener(PROFILE_EVENT, profileHandler);
  window.addEventListener('storage', storageHandler);
  if (channel) channel.addEventListener('message', channelHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener(PROFILE_EVENT, profileHandler);
    window.removeEventListener('storage', storageHandler);
    if (channel) {
      channel.removeEventListener('message', channelHandler);
      channel.close();
    }
  };
}

export function getActiveLocalProfileId() {
  const state = readLocalState();
  const stored = sessionStorage.getItem(ACTIVE_PROFILE_KEY);
  if (stored && state.directory.some(item => item.id === stored && item.status === 'active')) return stored;
  sessionStorage.setItem(ACTIVE_PROFILE_KEY, 'local-user-jose');
  return 'local-user-jose';
}

export function getActiveLocalProfile() {
  const state = readLocalState();
  const id = getActiveLocalProfileId();
  const row = state.directory.find(item => item.id === id) || state.directory[0] || seedDirectory[0];
  return {
    id: row.id,
    displayName: row.display_name,
    username: String(row.username || '').toUpperCase(),
    zone: row.zone || 'Sin zona definida',
    role: row.role || 'user',
    accountType: row.account_type || 'adult',
    avatarUrl: row.avatar_url || null,
    status: row.status || 'active',
    schoolId: row.school_id || null,
    schoolRole: row.school_role || null,
    builtin: Boolean(row.builtin)
  };
}

export function listLocalProfiles() {
  return readLocalState().directory.filter(item => item.status === 'active').map(normalizeProfile);
}

export function switchLocalProfile(profileId) {
  const state = readLocalState();
  const found = state.directory.find(item => item.id === profileId && item.status === 'active');
  if (!found) throw new Error('El perfil local no está disponible.');
  sessionStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(getActiveLocalProfile()));
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { reason: 'profile-switch', profileId } }));
  return getActiveLocalProfile();
}

export function createLocalProfile({ displayName, username, accountType = 'adult', zone = '', role = 'user', schoolId = null, schoolRole = null, password = '', secretQuestion = '', secretAnswer = '' }) {
  const normalized = String(username || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
  if (!/^[A-Z0-9_]{4,20}$/.test(normalized)) throw new Error('El usuario debe tener entre 4 y 20 caracteres: letras, números o guion bajo.');
  const cleanName = String(displayName || '').trim();
  if (cleanName.length < 2) throw new Error('Escribe un nombre visible válido.');
  const state = readLocalState();
  if (state.directory.some(item => String(item.username).toUpperCase() === normalized)) throw new Error('Ese usuario local ya existe.');
  const profileId = uid('local-user');
  mutateLocalState(draft => {
    draft.directory.push(normalizeProfile({
      id: profileId,
      username: normalized,
      display_name: cleanName,
      account_type: accountType,
      role: ['user','admin','super_admin'].includes(role) ? role : 'user',
      zone: String(zone || '').trim() || 'Sin zona definida',
      school_id: schoolId || null,
      school_role: schoolRole || null,
      status: 'active',
      builtin: false,
      created_at: new Date().toISOString(),
      local_password_hash: String(password || '').trim() ? hashLocalSecret(password) : '',
      secret_question: String(secretQuestion || '').trim(),
      secret_answer_hash: String(secretAnswer || '').trim() ? hashLocalSecret(normalizeLocalSecret(secretAnswer)) : ''
    }));
    draft.preferencesByUser[profileId] = { community: true, chat: true, offers: true, courses: false, ride: true };
    addAudit(draft, 'local_profile_create', 'profile', profileId, normalized);
  }, 'profile-create');
  return switchLocalProfile(profileId);
}

export function updateActiveLocalProfile(values) {
  const profileId = getActiveLocalProfileId();
  const normalized = String(values.username || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
  if (!/^[A-Z0-9_]{4,20}$/.test(normalized)) throw new Error('El usuario debe tener entre 4 y 20 caracteres válidos.');
  mutateLocalState(draft => {
    if (draft.directory.some(item => item.id !== profileId && String(item.username).toUpperCase() === normalized)) throw new Error('Ese usuario local ya existe.');
    const row = draft.directory.find(item => item.id === profileId);
    if (!row) throw new Error('El perfil local no existe.');
    row.display_name = String(values.displayName || '').trim() || row.display_name;
    row.username = normalized;
    row.zone = String(values.zone || '').trim() || 'Sin zona definida';
    addAudit(draft, 'local_profile_update', 'profile', profileId, normalized);
  }, 'profile-update');
  const next = getActiveLocalProfile();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function deleteLocalProfile(profileId) {
  const state = readLocalState();
  const row = state.directory.find(item => item.id === profileId);
  if (!row) throw new Error('El perfil no existe.');
  if (row.builtin) throw new Error('Los perfiles de demostración no se pueden eliminar.');
  if (profileId === getActiveLocalProfileId()) throw new Error('Cambia a otro perfil antes de eliminar este.');
  mutateLocalState(draft => {
    draft.directory = draft.directory.filter(item => item.id !== profileId);
    draft.contactPairs = draft.contactPairs.filter(item => item.user_a !== profileId && item.user_b !== profileId);
    draft.requests = draft.requests.filter(item => item.sender_id !== profileId && item.receiver_id !== profileId);
    draft.blocks = draft.blocks.filter(item => item.blocker_id !== profileId && item.blocked_id !== profileId);
    draft.notifications = draft.notifications.filter(item => item.user_id !== profileId);
    draft.conversations.forEach(item => { item.participant_ids = (item.participant_ids || []).filter(id => id !== profileId); });
    draft.conversations = draft.conversations.filter(item => (item.participant_ids || []).length > 0);
    delete draft.preferencesByUser[profileId];
    addAudit(draft, 'local_profile_delete', 'profile', profileId, row.username);
  }, 'profile-delete');
  return true;
}

export function localProfileRequiresPassword(username) {
  const normalized = String(username || '').trim().toUpperCase();
  const state = readLocalState();
  const row = state.directory.find(item => String(item.username || '').toUpperCase() === normalized && item.status === 'active');
  return Boolean(row?.local_password_hash);
}

export function verifyLocalProfilePassword(username, password) {
  const normalized = String(username || '').trim().toUpperCase();
  const state = readLocalState();
  const row = state.directory.find(item => String(item.username || '').toUpperCase() === normalized && item.status === 'active');
  if (!row) throw new Error('No existe un perfil local con ese usuario.');
  if (!row.local_password_hash) return true;
  if (row.local_password_hash !== hashLocalSecret(password || '')) throw new Error('Contraseña local incorrecta.');
  return true;
}

export function updateLocalProfileSecurity({ currentPassword = '', newPassword = '', secretQuestion = '', secretAnswer = '' }) {
  const profileId = getActiveLocalProfileId();
  const state = readLocalState();
  const row = state.directory.find(item => item.id === profileId);
  if (!row) throw new Error('El perfil local no existe.');
  if (row.local_password_hash && row.local_password_hash !== hashLocalSecret(currentPassword || '')) throw new Error('La contraseña actual no es correcta.');
  const cleanPassword = String(newPassword || '').trim();
  if (cleanPassword && cleanPassword.length < 4) throw new Error('La nueva contraseña debe tener como mínimo 4 caracteres.');
  mutateLocalState(draft => {
    const target = draft.directory.find(item => item.id === profileId);
    if (!target) throw new Error('El perfil local no existe.');
    if (cleanPassword) target.local_password_hash = hashLocalSecret(cleanPassword);
    if (String(secretQuestion || '').trim()) target.secret_question = String(secretQuestion || '').trim();
    if (String(secretAnswer || '').trim()) target.secret_answer_hash = hashLocalSecret(normalizeLocalSecret(secretAnswer));
    addAudit(draft, 'local_security_update', 'profile', profileId, 'Contraseña/pregunta local actualizada');
  }, 'profile-security-update');
  return true;
}

export function getLocalRecoveryQuestion(username) {
  const normalized = String(username || '').trim().toUpperCase();
  const state = readLocalState();
  const row = state.directory.find(item => String(item.username || '').toUpperCase() === normalized && item.status === 'active');
  if (!row) throw new Error('No existe un perfil local con ese usuario.');
  if (!row.secret_question || !row.secret_answer_hash) throw new Error('Ese perfil aún no tiene pregunta secreta configurada.');
  return row.secret_question;
}

export function recoverLocalProfilePassword({ username = '', secretAnswer = '', newPassword = '' }) {
  const normalized = String(username || '').trim().toUpperCase();
  const cleanPassword = String(newPassword || '').trim();
  if (cleanPassword.length < 4) throw new Error('La nueva contraseña debe tener como mínimo 4 caracteres.');
  mutateLocalState(draft => {
    const row = draft.directory.find(item => String(item.username || '').toUpperCase() === normalized && item.status === 'active');
    if (!row) throw new Error('No existe un perfil local con ese usuario.');
    if (!row.secret_question || !row.secret_answer_hash) throw new Error('Ese perfil no tiene recuperación configurada.');
    if (row.secret_answer_hash !== hashLocalSecret(normalizeLocalSecret(secretAnswer))) throw new Error('La respuesta secreta no es correcta.');
    row.local_password_hash = hashLocalSecret(cleanPassword);
    addAudit(draft, 'local_password_recovery', 'profile', row.id, 'Contraseña local recuperada');
  }, 'profile-password-recovery');
  return true;
}

function normalizeLocalSecret(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function hashLocalSecret(value) {
  const text = String(value || '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `local-${(hash >>> 0).toString(16)}`;
}

function readProfile() {
  return getActiveLocalProfile();
}

function addAudit(draft, action, entityType, entityId, detail = '') {
  const actor = getActiveLocalProfileId();
  draft.auditLogs.unshift({ id: uid('audit'), actor_id: actor, action, entity_type: entityType, entity_id: entityId, detail, created_at: new Date().toISOString() });
  draft.auditLogs = draft.auditLogs.slice(0, 500);
}

function enqueue(draft, action, entityType, entityId, payload = {}) {
  draft.syncQueue.unshift({ id: uid('queue'), actor_id: getActiveLocalProfileId(), action, entity_type: entityType, entity_id: entityId, payload, status: 'local_only', created_at: new Date().toISOString() });
  draft.syncQueue = draft.syncQueue.slice(0, 800);
}

function pushNotification(draft, notification) {
  const userId = notification.userId || getActiveLocalProfileId();
  draft.notifications.unshift({
    id: uid('not'),
    user_id: userId,
    type: notification.type || 'system',
    title: notification.title || 'MiZona',
    body: notification.body || '',
    page: notification.page || 'notifications',
    read: false,
    created_at: new Date().toISOString()
  });
  draft.notifications = draft.notifications.slice(0, 500);
}

function getProfileRow(state, id) {
  return state.directory.find(item => item.id === id) || null;
}

function isBlockedBetween(state, a, b) {
  return state.blocks.some(item => (item.blocker_id === a && item.blocked_id === b) || (item.blocker_id === b && item.blocked_id === a));
}

function sharesAllowedSchoolRelation(current, target) {
  if (target.account_type !== 'student') return true;
  if (!current?.school_id || current.school_id !== target.school_id) return false;
  return current.account_type === 'student' || ['parent','teacher','assistant','admin'].includes(current.school_role);
}

export function getLocalChatContacts() {
  const state = readLocalState();
  const currentId = getActiveLocalProfileId();
  const ids = state.contactPairs
    .filter(item => item.user_a === currentId || item.user_b === currentId)
    .map(item => item.user_a === currentId ? item.user_b : item.user_a);
  return ids.map(id => {
    const row = getProfileRow(state, id);
    return row ? { ...normalizeProfile(row), is_blocked: state.blocks.some(item => item.blocker_id === currentId && item.blocked_id === id) } : null;
  }).filter(Boolean);
}

export function getLocalChatRequests() {
  const state = readLocalState();
  const currentId = getActiveLocalProfileId();
  return state.requests
    .filter(item => item.sender_id === currentId || item.receiver_id === currentId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(item => {
      const direction = item.receiver_id === currentId ? 'received' : 'sent';
      const otherId = direction === 'received' ? item.sender_id : item.receiver_id;
      const other = getProfileRow(state, otherId) || {};
      return {
        ...item,
        other_user_id: otherId,
        username: other.username,
        display_name: other.display_name,
        avatar_url: other.avatar_url,
        account_type: other.account_type,
        direction
      };
    });
}

export function getLocalConversations() {
  const state = readLocalState();
  const currentId = getActiveLocalProfileId();
  return state.conversations
    .filter(item => (item.participant_ids || []).includes(currentId))
    .map(item => {
      if (item.type !== 'direct') return { ...item, unread_count: Number(item.unread_by?.[currentId] || 0) };
      const peerId = (item.participant_ids || []).find(id => id !== currentId);
      const peer = getProfileRow(state, peerId) || {};
      return {
        ...item,
        peer_id: peerId,
        peer_username: peer.username,
        peer_display_name: peer.display_name,
        peer_avatar_url: peer.avatar_url,
        unread_count: Number(item.unread_by?.[currentId] || 0)
      };
    })
    .sort((a, b) => new Date(b.last_message_at || b.updated_at || 0) - new Date(a.last_message_at || a.updated_at || 0));
}

export function getLocalMessages(conversationId) {
  const state = readLocalState();
  const conversation = state.conversations.find(item => item.id === conversationId);
  const currentId = getActiveLocalProfileId();
  if (!conversation || !(conversation.participant_ids || []).includes(currentId)) return [];
  const currentTime = Date.now();
  return (state.messages[conversationId] || []).filter(message => !message.expires_at || new Date(message.expires_at).getTime() > currentTime);
}

export function findLocalProfileExact(username) {
  const normalized = String(username || '').trim().toUpperCase();
  const state = readLocalState();
  const current = getProfileRow(state, getActiveLocalProfileId());
  const target = state.directory.find(item => String(item.username).toUpperCase() === normalized && item.status === 'active') || null;
  if (!target || target.id === current?.id || isBlockedBetween(state, current?.id, target.id)) return null;
  if (!sharesAllowedSchoolRelation(current, target)) return null;
  return normalizeProfile(target);
}

export function sendLocalContactRequest(username) {
  const target = findLocalProfileExact(username);
  if (!target) throw new Error('No se encontró un usuario disponible con ese nombre exacto.');
  const state = readLocalState();
  const currentId = getActiveLocalProfileId();
  if (state.contactPairs.some(item => pairKey(item.user_a, item.user_b) === pairKey(currentId, target.id))) throw new Error('Ese usuario ya está en tus contactos.');
  if (state.requests.some(item => pairKey(item.sender_id, item.receiver_id) === pairKey(currentId, target.id) && item.status === 'pending')) throw new Error('Ya existe una solicitud pendiente con ese usuario.');
  const requestId = uid('req');
  mutateLocalState(draft => {
    draft.requests.unshift({ id: requestId, sender_id: currentId, receiver_id: target.id, status: 'pending', created_at: new Date().toISOString() });
    enqueue(draft, 'contact_request_create', 'contact_request', requestId, { target_id: target.id });
    addAudit(draft, 'contact_request_create', 'contact_request', requestId, `Solicitud enviada a @${target.username}`);
    pushNotification(draft, { userId: target.id, type: 'chat', title: 'Nueva solicitud de contacto', body: `@${readProfile().username} quiere agregarte a MiZona Chat.`, page: 'chat' });
  }, 'contact-request');
  return requestId;
}

export function reviewLocalContactRequest(requestId, action) {
  if (!['accepted','rejected'].includes(action)) throw new Error('Acción de solicitud inválida.');
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => {
    const request = draft.requests.find(item => item.id === requestId);
    if (!request || request.receiver_id !== currentId) throw new Error('La solicitud ya no existe o no te pertenece.');
    request.status = action;
    request.reviewed_at = new Date().toISOString();
    if (action === 'accepted' && !draft.contactPairs.some(item => pairKey(item.user_a, item.user_b) === pairKey(request.sender_id, request.receiver_id))) {
      draft.contactPairs.push({ id: uid('contact'), user_a: request.sender_id, user_b: request.receiver_id, created_at: new Date().toISOString() });
    }
    enqueue(draft, 'contact_request_review', 'contact_request', requestId, { action });
    addAudit(draft, 'contact_request_review', 'contact_request', requestId, action);
    const reviewer = getProfileRow(draft, currentId);
    pushNotification(draft, { userId: request.sender_id, type: 'chat', title: action === 'accepted' ? 'Solicitud aceptada' : 'Solicitud rechazada', body: `${reviewer?.display_name || 'Un usuario'} ${action === 'accepted' ? 'aceptó' : 'rechazó'} tu solicitud.`, page: 'chat' });
  }, 'contact-request-review');
  return action;
}

export function blockLocalUser(userId, reason = '') {
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => {
    if (!draft.blocks.some(item => item.blocker_id === currentId && item.blocked_id === userId)) draft.blocks.push({ id: uid('block'), blocker_id: currentId, blocked_id: userId, reason, created_at: new Date().toISOString() });
    // Se conserva el contacto, la conversación y todo el historial.
    // El bloqueo solo impide nuevas interacciones hasta que el usuario lo desbloquee.
    draft.requests = draft.requests.filter(item => !(item.status === 'pending' && pairKey(item.sender_id, item.receiver_id) === pairKey(currentId, userId)));
    enqueue(draft, 'user_block', 'profile', userId, { reason });
    addAudit(draft, 'user_block', 'profile', userId, reason || 'Sin motivo registrado');
  }, 'user-block');
  return true;
}

export function unblockLocalUser(userId) {
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => {
    draft.blocks = draft.blocks.filter(item => !(item.blocker_id === currentId && item.blocked_id === userId));
    enqueue(draft, 'user_unblock', 'profile', userId);
    addAudit(draft, 'user_unblock', 'profile', userId);
  }, 'user-unblock');
  return true;
}

export function startLocalDirectConversation(targetId) {
  const state = readLocalState();
  const currentId = getActiveLocalProfileId();
  if (!state.contactPairs.some(item => pairKey(item.user_a, item.user_b) === pairKey(currentId, targetId))) throw new Error('Primero deben ser contactos aceptados.');
  const existing = state.conversations.find(item => item.type === 'direct' && pairKey(...item.participant_ids) === pairKey(currentId, targetId));
  if (existing) return existing.id;
  const target = getProfileRow(state, targetId);
  if (!target) throw new Error('El contacto no está disponible.');
  const conversationId = uid('conv-direct');
  mutateLocalState(draft => {
    draft.conversations.unshift({ id: conversationId, type: 'direct', title: null, participant_ids: [currentId, targetId], creator_id: currentId, retention_days: 7, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString(), unread_by: { [currentId]: 0, [targetId]: 0 }, last_message: 'Conversación nueva' });
    draft.messages[conversationId] = [];
    enqueue(draft, 'conversation_create', 'conversation', conversationId, { type: 'direct', target_id: targetId });
    addAudit(draft, 'conversation_create', 'conversation', conversationId, `Chat directo con @${target.username}`);
  }, 'conversation-create');
  return conversationId;
}

export function createLocalGroup({ title, memberIds = [], communityId = null, roomId = null }) {
  const cleanTitle = String(title || '').trim();
  if (cleanTitle.length < 3) throw new Error('El nombre del grupo debe tener al menos 3 caracteres.');
  const currentId = getActiveLocalProfileId();
  const state = readLocalState();
  const contacts = new Set(getLocalChatContacts().map(item => item.id));
  const allowedIds = memberIds.filter(id => contacts.has(id));
  if (communityId) {
    const current = getProfileRow(state, currentId);
    for (const id of allowedIds) {
      const target = getProfileRow(state, id);
      if (current?.school_id !== communityId || target?.school_id !== communityId) throw new Error('Todos los integrantes del grupo escolar deben pertenecer al mismo colegio.');
    }
  }
  const conversationId = uid('conv-group');
  const type = communityId ? (roomId ? 'school_room' : 'school_group') : 'group';
  const participants = Array.from(new Set([currentId, ...allowedIds]));
  mutateLocalState(draft => {
    const unreadBy = Object.fromEntries(participants.map(id => [id, 0]));
    draft.conversations.unshift({ id: conversationId, type, title: cleanTitle, participant_ids: participants, creator_id: currentId, community_id: communityId, room_id: roomId, retention_days: 7, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString(), unread_by: unreadBy, last_message: 'Grupo creado en modo local' });
    draft.messages[conversationId] = [];
    enqueue(draft, 'conversation_create', 'conversation', conversationId, { type, participant_ids: participants, community_id: communityId, room_id: roomId });
    addAudit(draft, 'conversation_create', 'conversation', conversationId, cleanTitle);
    participants.filter(id => id !== currentId).forEach(id => pushNotification(draft, { userId: id, type: 'chat', title: 'Te agregaron a un grupo', body: `${readProfile().displayName} creó ${cleanTitle}.`, page: 'chat' }));
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
    if (!conversation || !(conversation.participant_ids || []).includes(profile.id)) throw new Error('La conversación no existe para este perfil.');
    const message = { id: messageId, sender_id: profile.id, sender_username: profile.username, sender_display_name: profile.displayName, body: cleanBody, message_type: 'text', reply_to: replyTo, created_at: createdAt, expires_at: new Date(Date.now() + (conversation.retention_days || 7) * 86400000).toISOString(), attachments: [], sync_status: 'local_only' };
    if (!draft.messages[conversationId]) draft.messages[conversationId] = [];
    draft.messages[conversationId].push(message);
    conversation.last_message = cleanBody;
    conversation.last_message_at = createdAt;
    conversation.updated_at = createdAt;
    conversation.unread_by = conversation.unread_by || {};
    (conversation.participant_ids || []).forEach(id => { conversation.unread_by[id] = id === profile.id ? 0 : Number(conversation.unread_by[id] || 0) + 1; });
    enqueue(draft, 'message_create', 'chat_message', messageId, { conversation_id: conversationId, body: cleanBody });
    addAudit(draft, 'message_create', 'chat_message', messageId, `Conversación ${conversationId}`);
    (conversation.participant_ids || []).filter(id => id !== profile.id).forEach(id => pushNotification(draft, { userId: id, type: 'chat', title: `Nuevo mensaje de ${profile.displayName}`, body: cleanBody.slice(0, 120), page: 'chat' }));
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
    if (!conversation || !(conversation.participant_ids || []).includes(profile.id)) throw new Error('La conversación no existe para este perfil.');
    const attachment = { id: uid('attachment'), file_name: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size, storage_path: `local:${fileId}`, local_file_id: fileId };
    const message = { id: messageId, sender_id: profile.id, sender_username: profile.username, sender_display_name: profile.displayName, body: file.name, message_type: String(file.type || '').startsWith('image/') ? 'image' : 'file', created_at: createdAt, expires_at: new Date(Date.now() + (conversation.retention_days || 7) * 86400000).toISOString(), attachments: [attachment], sync_status: 'local_only' };
    if (!draft.messages[conversationId]) draft.messages[conversationId] = [];
    draft.messages[conversationId].push(message);
    conversation.last_message = `📎 ${file.name}`;
    conversation.last_message_at = createdAt;
    conversation.updated_at = createdAt;
    conversation.unread_by = conversation.unread_by || {};
    (conversation.participant_ids || []).forEach(id => { conversation.unread_by[id] = id === profile.id ? 0 : Number(conversation.unread_by[id] || 0) + 1; });
    enqueue(draft, 'file_message_create', 'chat_message', messageId, { conversation_id: conversationId, file_name: file.name, size: file.size });
    addAudit(draft, 'file_message_create', 'chat_message', messageId, file.name);
    (conversation.participant_ids || []).filter(id => id !== profile.id).forEach(id => pushNotification(draft, { userId: id, type: 'chat', title: `${profile.displayName} envió un archivo`, body: file.name, page: 'chat' }));
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
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => {
    const conversation = draft.conversations.find(item => item.id === conversationId);
    if (conversation?.unread_by) conversation.unread_by[currentId] = 0;
  }, 'conversation-read');
  return true;
}

export function leaveLocalConversation(conversationId) {
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => {
    const conversation = draft.conversations.find(item => item.id === conversationId);
    if (!conversation) return;
    conversation.participant_ids = (conversation.participant_ids || []).filter(id => id !== currentId);
    if (conversation.unread_by) delete conversation.unread_by[currentId];
    if (!conversation.participant_ids.length) {
      draft.conversations = draft.conversations.filter(item => item.id !== conversationId);
      delete draft.messages[conversationId];
    }
    enqueue(draft, 'conversation_leave', 'conversation', conversationId);
    addAudit(draft, 'conversation_leave', 'conversation', conversationId);
  }, 'conversation-leave');
  return true;
}

export function reportLocalChatItem({ conversationId, messageId = null, reportedUserId = null, reason, details = '', reporterId = null }) {
  const reportId = uid('report');
  mutateLocalState(draft => {
    draft.reports.unshift({ id: reportId, reporter_id: reporterId || getActiveLocalProfileId(), conversation_id: conversationId, message_id: messageId, reported_user_id: reportedUserId, reason: String(reason || 'Otro'), details: details || '', status: 'pending', created_at: new Date().toISOString(), source: 'local' });
    enqueue(draft, 'report_create', 'chat_report', reportId, { conversation_id: conversationId, message_id: messageId, reason });
    addAudit(draft, 'report_create', 'chat_report', reportId, reason);
    const admins = draft.directory.filter(item => ['admin','super_admin'].includes(item.role));
    admins.forEach(admin => pushNotification(draft, { userId: admin.id, type: 'moderation', title: 'Nuevo reporte local', body: 'Hay un mensaje pendiente de revisión.', page: 'admin' }));
  }, 'report-create');
  return reportId;
}

export function listLocalReports() {
  return readLocalState().reports;
}

export function reviewLocalReport(reportId, status, reviewerId = null) {
  if (!['pending','reviewing','resolved','dismissed'].includes(status)) throw new Error('Estado de reporte inválido.');
  mutateLocalState(draft => {
    const report = draft.reports.find(item => item.id === reportId);
    if (!report) throw new Error('El reporte no existe.');
    report.status = status;
    report.reviewed_at = new Date().toISOString();
    report.reviewed_by = reviewerId || getActiveLocalProfileId();
    addAudit(draft, 'report_review', 'chat_report', reportId, status);
    pushNotification(draft, { userId: report.reporter_id, type: 'moderation', title: 'Reporte actualizado', body: `El reporte pasó al estado ${status}.`, page: 'admin' });
  }, 'report-review');
  return true;
}

export function listLocalNotifications() {
  const currentId = getActiveLocalProfileId();
  return readLocalState().notifications.filter(item => item.user_id === currentId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function unreadLocalNotifications() {
  return listLocalNotifications().filter(item => !item.read).length;
}

export function markLocalNotification(notificationId, read = true) {
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => {
    const item = draft.notifications.find(notification => notification.id === notificationId && notification.user_id === currentId);
    if (item) item.read = read;
  }, 'notification-read');
}

export function markAllLocalNotificationsRead() {
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => { draft.notifications.filter(item => item.user_id === currentId).forEach(item => { item.read = true; }); }, 'notifications-read-all');
}

export function deleteLocalNotification(notificationId) {
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => { draft.notifications = draft.notifications.filter(item => !(item.id === notificationId && item.user_id === currentId)); }, 'notification-delete');
}

export function listLocalAuditLogs() {
  return readLocalState().auditLogs;
}

export function listLocalSyncQueue() {
  return readLocalState().syncQueue;
}

export function getLocalStats() {
  const state = readLocalState();
  const currentId = getActiveLocalProfileId();
  const conversations = state.conversations.filter(item => (item.participant_ids || []).includes(currentId));
  return {
    profiles: state.directory.filter(item => item.status === 'active').length,
    contacts: getLocalChatContacts().length,
    conversations: conversations.length,
    messages: conversations.reduce((total, conversation) => total + (state.messages[conversation.id] || []).length, 0),
    reportsPending: state.reports.filter(item => item.status === 'pending').length,
    notificationsUnread: listLocalNotifications().filter(item => !item.read).length,
    syncPending: state.syncQueue.filter(item => item.status === 'local_only').length,
    blocked: state.blocks.filter(item => item.blocker_id === currentId).length,
    updatedAt: state.updatedAt
  };
}

export function getLocalPreferences() {
  const state = readLocalState();
  const currentId = getActiveLocalProfileId();
  return state.preferencesByUser[currentId] || { community: true, chat: true, offers: true, courses: false, ride: true };
}

export function saveLocalPreferences(preferences) {
  const currentId = getActiveLocalProfileId();
  mutateLocalState(draft => {
    draft.preferencesByUser[currentId] = { ...(draft.preferencesByUser[currentId] || {}), ...preferences };
    addAudit(draft, 'preferences_update', 'preferences', currentId, JSON.stringify(preferences));
  }, 'preferences-update');
  return true;
}

export function exportLocalBackup() {
  const payload = {
    exported_at: new Date().toISOString(),
    app: 'MiZona Enterprise V8',
    stage: 14,
    active_profile_id: getActiveLocalProfileId(),
    state: readLocalState()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `mizona-etapa14-respaldo-${new Date().toISOString().slice(0,10)}.json`;
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
  const next = state.version === 14 ? state : migrateLegacyState(state);
  next.version = 14;
  writeLocalState(next, 'backup-import');
  if (parsed.active_profile_id && next.directory.some(item => item.id === parsed.active_profile_id)) sessionStorage.setItem(ACTIVE_PROFILE_KEY, parsed.active_profile_id);
  return true;
}

export function resetLocalData() {
  localStorage.setItem(STATE_KEY, JSON.stringify(seedState()));
  sessionStorage.setItem(ACTIVE_PROFILE_KEY, 'local-user-jose');
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason: 'reset', state: readLocalState() } }));
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { reason: 'profile-switch', profileId: 'local-user-jose' } }));
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
