import {
  getActiveLocalProfile,
  getActiveLocalProfileId,
  getLocalFile,
  mutateLocalState,
  putLocalFile,
  readLocalState,
  subscribeLocalData
} from './localStore';

const COMMUNITY_KEY = 'mizona-v8-local-community-v15';
const COMMUNITY_EVENT = 'mizona:local-community-change';
const COMMUNITY_CHANNEL = 'mizona-v8-local-community-v15';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(COMMUNITY_CHANNEL) : null;

const now = Date.now();
const iso = value => new Date(value).toISOString();
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

function seedCommunityState() {
  return {
    version: 15,
    communities: [
      {
        id: 'san-martin', owner_id: 'local-user-jose', name: 'Colegio San Martín', slug: 'colegio-san-martin',
        type: 'school', zone: 'Ventanilla', description: 'Comunidad escolar local para probar comunicados, aulas, miembros y documentos.',
        status: 'active', visibility: 'public', join_mode: 'request', invite_code: 'SANMARTIN2026', member_count: 4,
        school_level: 'Primaria y secundaria', created_at: iso(now - 90 * 86400000), updated_at: iso(now - 2 * 3600000)
      },
      {
        id: 'comite-los-pinos', owner_id: 'local-maria', name: 'Comité Vecinal Los Pinos', slug: 'comite-los-pinos',
        type: 'committee', zone: 'Pachacútec', description: 'Organización vecinal para reuniones, avisos y actividades comunitarias.',
        status: 'active', visibility: 'public', join_mode: 'open', invite_code: null, member_count: 2,
        school_level: null, created_at: iso(now - 70 * 86400000), updated_at: iso(now - 86400000)
      },
      {
        id: 'club-pachacutec', owner_id: 'local-carlos', name: 'Club Deportivo Pachacútec', slug: 'club-deportivo-pachacutec',
        type: 'club', zone: 'Pachacútec', description: 'Solicitud local pendiente para probar el flujo de aprobación.',
        status: 'pending', visibility: 'public', join_mode: 'request', invite_code: null, member_count: 1,
        school_level: null, created_at: iso(now - 2 * 86400000), updated_at: iso(now - 2 * 86400000)
      }
    ],
    memberships: [
      { community_id: 'san-martin', user_id: 'local-user-jose', role: 'owner', status: 'active', relationship: 'padre', joined_at: iso(now - 90 * 86400000), created_at: iso(now - 90 * 86400000) },
      { community_id: 'san-martin', user_id: 'local-ian', role: 'student', status: 'active', relationship: 'estudiante', joined_at: iso(now - 80 * 86400000), created_at: iso(now - 80 * 86400000) },
      { community_id: 'san-martin', user_id: 'local-dylan', role: 'student', status: 'active', relationship: 'estudiante', joined_at: iso(now - 80 * 86400000), created_at: iso(now - 80 * 86400000) },
      { community_id: 'san-martin', user_id: 'local-teacher', role: 'teacher', status: 'active', relationship: 'docente', joined_at: iso(now - 85 * 86400000), created_at: iso(now - 85 * 86400000) },
      { community_id: 'comite-los-pinos', user_id: 'local-maria', role: 'owner', status: 'active', relationship: 'dirigente', joined_at: iso(now - 70 * 86400000), created_at: iso(now - 70 * 86400000) },
      { community_id: 'comite-los-pinos', user_id: 'local-carlos', role: 'member', status: 'active', relationship: 'vecino', joined_at: iso(now - 20 * 86400000), created_at: iso(now - 20 * 86400000) },
      { community_id: 'club-pachacutec', user_id: 'local-carlos', role: 'owner', status: 'active', relationship: 'organizador', joined_at: iso(now - 2 * 86400000), created_at: iso(now - 2 * 86400000) }
    ],
    announcements: [
      { id: 'local-ann-1', community_id: 'san-martin', author_id: 'local-teacher', title: 'Reunión de padres', body: 'La reunión general será hoy a las 7:00 p. m. en el auditorio.', audience: 'members', status: 'published', is_pinned: true, published_at: iso(now - 3 * 3600000), created_at: iso(now - 3 * 3600000) },
      { id: 'local-ann-2', community_id: 'comite-los-pinos', author_id: 'local-maria', title: 'Faena comunitaria', body: 'El sábado realizaremos limpieza del parque principal desde las 8:00 a. m.', audience: 'public', status: 'published', is_pinned: false, published_at: iso(now - 86400000), created_at: iso(now - 86400000) }
    ],
    events: [
      { id: 'local-event-1', community_id: 'san-martin', author_id: 'local-teacher', title: 'Feria de ciencias', description: 'Exposición de proyectos de primaria y secundaria.', location: 'Patio principal', starts_at: iso(now + 4 * 86400000), ends_at: iso(now + 4 * 86400000 + 3 * 3600000), audience: 'members', status: 'published', created_at: iso(now - 2 * 86400000) },
      { id: 'local-event-2', community_id: 'comite-los-pinos', author_id: 'local-maria', title: 'Asamblea vecinal', description: 'Revisión de seguridad y alumbrado público.', location: 'Local comunal', starts_at: iso(now + 2 * 86400000), ends_at: null, audience: 'public', status: 'published', created_at: iso(now - 2 * 86400000) }
    ],
    rooms: [
      { id: '5a', community_id: 'san-martin', name: '5.º A', grade: 'Quinto', section: 'A', teacher_id: 'local-teacher', status: 'active', created_by: 'local-teacher', conversation_id: 'conv-school', created_at: iso(now - 40 * 86400000) }
    ],
    documents: [
      { id: 'local-doc-demo', community_id: 'san-martin', uploader_id: 'local-teacher', title: 'Guía de laboratorio', file_name: 'guia_laboratorio.pdf', storage_path: null, local_file_id: null, mime_type: 'application/pdf', size_bytes: 284000, visibility: 'members', created_at: iso(now - 2 * 86400000), demo: true }
    ],
    updated_at: new Date().toISOString()
  };
}

function ensureShape(value) {
  const seed = seedCommunityState();
  if (!value || typeof value !== 'object') return seed;
  return {
    ...seed,
    ...value,
    version: 15,
    communities: Array.isArray(value.communities) ? value.communities : seed.communities,
    memberships: Array.isArray(value.memberships) ? value.memberships : seed.memberships,
    announcements: Array.isArray(value.announcements) ? value.announcements : seed.announcements,
    events: Array.isArray(value.events) ? value.events : seed.events,
    rooms: Array.isArray(value.rooms) ? value.rooms : seed.rooms,
    documents: Array.isArray(value.documents) ? value.documents : seed.documents
  };
}

export function readLocalCommunityState() {
  try {
    const saved = JSON.parse(localStorage.getItem(COMMUNITY_KEY) || 'null');
    const next = ensureShape(saved);
    if (!saved) localStorage.setItem(COMMUNITY_KEY, JSON.stringify(next));
    return clone(next);
  } catch {
    const next = seedCommunityState();
    localStorage.setItem(COMMUNITY_KEY, JSON.stringify(next));
    return clone(next);
  }
}

function writeLocalCommunityState(next, reason = 'community-update') {
  const safe = ensureShape(next);
  safe.updated_at = new Date().toISOString();
  localStorage.setItem(COMMUNITY_KEY, JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent(COMMUNITY_EVENT, { detail: { reason } }));
  channel?.postMessage({ reason, at: Date.now() });
  return clone(safe);
}

function mutateCommunity(mutator, reason = 'community-update') {
  const state = readLocalCommunityState();
  mutator(state);
  refreshCounts(state);
  return writeLocalCommunityState(state, reason);
}

function refreshCounts(state) {
  for (const community of state.communities) {
    community.member_count = state.memberships.filter(item => item.community_id === community.id && item.status === 'active').length;
    community.updated_at = community.updated_at || new Date().toISOString();
  }
}

function profileRow(userId) {
  return readLocalState().directory.find(item => item.id === userId) || null;
}

function currentMembership(state, communityId, userId = getActiveLocalProfileId()) {
  return state.memberships.find(item => item.community_id === communityId && item.user_id === userId) || null;
}

function isPlatformAdmin() {
  return ['admin', 'super_admin'].includes(getActiveLocalProfile().role);
}

function canManageCommunity(state, communityId, userId = getActiveLocalProfileId()) {
  if (isPlatformAdmin()) return true;
  const membership = currentMembership(state, communityId, userId);
  return membership?.status === 'active' && ['owner', 'admin', 'moderator'].includes(membership.role);
}

function canPublishCommunity(state, communityId, userId = getActiveLocalProfileId()) {
  if (canManageCommunity(state, communityId, userId)) return true;
  const membership = currentMembership(state, communityId, userId);
  return membership?.status === 'active' && membership.role === 'teacher';
}

function notifyUsers(userIds, { title, body, page = 'community', type = 'community' }) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (!unique.length) return;
  mutateLocalState(draft => {
    for (const userId of unique) {
      draft.notifications.unshift({
        id: uid('not-community'), user_id: userId, type, title, body, page, read: false, created_at: new Date().toISOString()
      });
    }
    draft.notifications = draft.notifications.slice(0, 500);
  }, 'community-notification');
}

function audit(action, entityType, entityId, detail = '') {
  mutateLocalState(draft => {
    draft.auditLogs.unshift({ id: uid('audit-community'), actor_id: getActiveLocalProfileId(), action, entity_type: entityType, entity_id: entityId, detail, created_at: new Date().toISOString() });
    draft.auditLogs = draft.auditLogs.slice(0, 500);
    draft.syncQueue.unshift({ id: uid('queue-community'), actor_id: getActiveLocalProfileId(), action, entity_type: entityType, entity_id: entityId, payload: { detail }, status: 'local_only', created_at: new Date().toISOString() });
    draft.syncQueue = draft.syncQueue.slice(0, 800);
  }, 'community-audit');
}

export function subscribeLocalCommunity(callback) {
  const onLocal = event => callback(event?.detail || { reason: 'local' });
  const onStorage = event => { if (event.key === COMMUNITY_KEY) callback({ reason: 'storage' }); };
  const onChannel = event => callback(event.data || { reason: 'broadcast' });
  window.addEventListener(COMMUNITY_EVENT, onLocal);
  window.addEventListener('storage', onStorage);
  channel?.addEventListener('message', onChannel);
  const unsubscribeMain = subscribeLocalData(event => {
    if (['profile-switch', 'profile-update', 'profile-create', 'profile-delete'].includes(event?.reason)) callback(event);
  });
  return () => {
    window.removeEventListener(COMMUNITY_EVENT, onLocal);
    window.removeEventListener('storage', onStorage);
    channel?.removeEventListener('message', onChannel);
    unsubscribeMain?.();
  };
}

export function listLocalCommunities() {
  const state = readLocalCommunityState();
  const userId = getActiveLocalProfileId();
  return state.communities
    .filter(item => item.status === 'active' || item.owner_id === userId || isPlatformAdmin())
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
}

export function listLocalMemberships(userId = getActiveLocalProfileId()) {
  return readLocalCommunityState().memberships.filter(item => item.user_id === userId);
}

export function loadLocalCommunityBundle(communityId) {
  const state = readLocalCommunityState();
  const membership = currentMembership(state, communityId);
  const canSeePrivate = isPlatformAdmin() || membership?.status === 'active';
  const directory = readLocalState().directory;
  const attachProfile = item => ({
    ...item,
    profile: (() => {
      const row = directory.find(profile => profile.id === item.user_id) || {};
      return { display_name: row.display_name || 'Usuario MiZona', username: row.username || 'USUARIO', account_type: row.account_type || 'adult', avatar_url: row.avatar_url || null };
    })()
  });
  return {
    announcements: state.announcements.filter(item => item.community_id === communityId && (item.audience === 'public' || canSeePrivate)).sort((a, b) => new Date(b.published_at) - new Date(a.published_at)),
    events: state.events.filter(item => item.community_id === communityId && (item.audience === 'public' || canSeePrivate)).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    rooms: canSeePrivate ? state.rooms.filter(item => item.community_id === communityId && item.status === 'active') : [],
    members: canSeePrivate ? state.memberships.filter(item => item.community_id === communityId).map(attachProfile) : [],
    documents: canSeePrivate ? state.documents.filter(item => item.community_id === communityId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []
  };
}

export function createLocalCommunity(values) {
  const name = String(values.name || '').trim();
  if (name.length < 3) throw new Error('El nombre debe tener al menos 3 caracteres.');
  const profile = getActiveLocalProfile();
  const communityId = uid('local-community');
  const active = isPlatformAdmin();
  mutateCommunity(state => {
    const slugBase = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'comunidad';
    let slug = slugBase;
    let suffix = 2;
    while (state.communities.some(item => item.slug === slug)) slug = `${slugBase}-${suffix++}`;
    state.communities.unshift({
      id: communityId, owner_id: profile.id, name, slug,
      type: values.type || 'other', zone: String(values.zone || '').trim(), description: String(values.description || '').trim(),
      status: active ? 'active' : 'pending', visibility: values.visibility || 'public', join_mode: values.joinMode || 'request',
      invite_code: values.joinMode === 'code' ? String(values.inviteCode || '').trim() : null,
      member_count: 1, school_level: values.type === 'school' ? values.schoolLevel || null : null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    state.memberships.push({ community_id: communityId, user_id: profile.id, role: 'owner', status: 'active', relationship: 'creador', joined_at: new Date().toISOString(), created_at: new Date().toISOString() });
  }, 'community-create');
  audit('community_create', 'community', communityId, name);
  if (!active) {
    const admins = readLocalState().directory.filter(item => ['admin', 'super_admin'].includes(item.role) && item.status === 'active').map(item => item.id);
    notifyUsers(admins, { title: 'Nueva comunidad pendiente', body: `${profile.displayName} solicitó crear ${name}.` });
  }
  return { id: communityId };
}

export function reviewLocalCommunity(communityId, status) {
  if (!isPlatformAdmin()) throw new Error('Solo un administrador de MiZona puede revisar comunidades.');
  if (!['active', 'rejected', 'suspended'].includes(status)) throw new Error('Estado inválido.');
  let ownerId = null;
  let name = '';
  mutateCommunity(state => {
    const community = state.communities.find(item => item.id === communityId);
    if (!community) throw new Error('La comunidad no existe.');
    community.status = status;
    community.updated_at = new Date().toISOString();
    ownerId = community.owner_id;
    name = community.name;
  }, 'community-review');
  audit('community_review', 'community', communityId, status);
  notifyUsers([ownerId], { title: status === 'active' ? 'Comunidad aprobada' : 'Comunidad revisada', body: `${name}: ${status === 'active' ? 'ya está activa' : 'estado ' + status}.` });
  return true;
}

export function requestLocalJoin(communityId, code = null) {
  const profile = getActiveLocalProfile();
  let result = 'pending';
  let communityName = '';
  let managerIds = [];
  mutateCommunity(state => {
    const community = state.communities.find(item => item.id === communityId && item.status === 'active');
    if (!community) throw new Error('La comunidad no está disponible.');
    communityName = community.name;
    const existing = currentMembership(state, communityId, profile.id);
    if (existing?.status === 'blocked') throw new Error('Tu acceso está bloqueado.');
    if (community.join_mode === 'invite') throw new Error('Esta comunidad admite únicamente invitaciones.');
    if (community.join_mode === 'code') {
      if (!code || String(code).trim().toUpperCase() !== String(community.invite_code || '').trim().toUpperCase()) throw new Error('Código incorrecto.');
      result = 'active';
    } else if (community.join_mode === 'open') result = 'active';
    else result = 'pending';
    const schoolRole = profile.schoolRole;
    const role = community.type === 'school'
      ? (schoolRole === 'teacher' ? 'teacher' : profile.accountType === 'student' ? 'student' : schoolRole === 'parent' ? 'parent' : 'member')
      : 'member';
    if (existing) {
      existing.status = result;
      existing.role = existing.role === 'owner' ? 'owner' : role;
      existing.joined_at = result === 'active' ? existing.joined_at || new Date().toISOString() : null;
    } else {
      state.memberships.push({ community_id: communityId, user_id: profile.id, role, status: result, relationship: null, joined_at: result === 'active' ? new Date().toISOString() : null, created_at: new Date().toISOString() });
    }
    managerIds = state.memberships.filter(item => item.community_id === communityId && item.status === 'active' && ['owner', 'admin', 'moderator'].includes(item.role)).map(item => item.user_id);
  }, 'community-join');
  audit('community_join_request', 'community', communityId, result);
  if (result === 'pending') notifyUsers(managerIds, { title: 'Nueva solicitud de ingreso', body: `${profile.displayName} quiere unirse a ${communityName}.` });
  return result;
}

export function leaveLocalCommunity(communityId) {
  const userId = getActiveLocalProfileId();
  mutateCommunity(state => {
    const membership = currentMembership(state, communityId, userId);
    if (!membership) throw new Error('No tienes una membresía en esta comunidad.');
    if (membership.role === 'owner') throw new Error('El propietario debe transferir la comunidad antes de salir.');
    membership.status = 'left';
    membership.updated_at = new Date().toISOString();
  }, 'community-leave');
  audit('community_leave', 'community', communityId);
  return true;
}

export function createLocalAnnouncement(communityId, values) {
  const state = readLocalCommunityState();
  if (!canPublishCommunity(state, communityId)) throw new Error('No tienes permiso para publicar comunicados.');
  const title = String(values.title || '').trim();
  const body = String(values.body || '').trim();
  if (title.length < 3 || body.length < 3) throw new Error('Completa el título y el mensaje.');
  const id = uid('local-announcement');
  let recipients = [];
  mutateCommunity(draft => {
    draft.announcements.unshift({ id, community_id: communityId, author_id: getActiveLocalProfileId(), title, body, audience: values.audience || 'members', status: 'published', is_pinned: Boolean(values.isPinned), published_at: new Date().toISOString(), created_at: new Date().toISOString() });
    recipients = draft.memberships.filter(item => item.community_id === communityId && item.status === 'active' && item.user_id !== getActiveLocalProfileId()).map(item => item.user_id);
  }, 'community-announcement');
  audit('announcement_create', 'community_announcement', id, title);
  notifyUsers(recipients, { title: 'Nuevo comunicado', body: title });
  return id;
}

export function createLocalEvent(communityId, values) {
  const state = readLocalCommunityState();
  if (!canPublishCommunity(state, communityId)) throw new Error('No tienes permiso para crear eventos.');
  const title = String(values.title || '').trim();
  if (title.length < 3 || !values.startsAt) throw new Error('Completa el título y la fecha del evento.');
  const id = uid('local-event');
  let recipients = [];
  mutateCommunity(draft => {
    draft.events.push({ id, community_id: communityId, author_id: getActiveLocalProfileId(), title, description: String(values.description || '').trim(), location: String(values.location || '').trim(), starts_at: new Date(values.startsAt).toISOString(), ends_at: values.endsAt ? new Date(values.endsAt).toISOString() : null, audience: values.audience || 'members', status: 'published', created_at: new Date().toISOString() });
    recipients = draft.memberships.filter(item => item.community_id === communityId && item.status === 'active' && item.user_id !== getActiveLocalProfileId()).map(item => item.user_id);
  }, 'community-event');
  audit('event_create', 'community_event', id, title);
  notifyUsers(recipients, { title: 'Nuevo evento', body: title });
  return id;
}

export function createLocalRoom(communityId, values) {
  const state = readLocalCommunityState();
  if (!canPublishCommunity(state, communityId)) throw new Error('No tienes permiso para crear aulas.');
  const community = state.communities.find(item => item.id === communityId);
  if (!community || community.type !== 'school') throw new Error('Las aulas solo se crean dentro de colegios.');
  const name = String(values.name || '').trim();
  if (name.length < 2) throw new Error('Escribe el nombre del aula.');
  const roomId = uid('local-room');
  const conversationId = uid('conv-school-room');
  const participantIds = state.memberships.filter(item => item.community_id === communityId && item.status === 'active').map(item => item.user_id);
  mutateCommunity(draft => {
    draft.rooms.unshift({ id: roomId, community_id: communityId, name, grade: String(values.grade || '').trim(), section: String(values.section || '').trim(), teacher_id: getActiveLocalProfileId(), status: 'active', created_by: getActiveLocalProfileId(), conversation_id: conversationId, created_at: new Date().toISOString() });
  }, 'community-room');
  mutateLocalState(draft => {
    const unreadBy = Object.fromEntries(participantIds.map(id => [id, 0]));
    draft.conversations.unshift({ id: conversationId, type: 'school_room', title: `${community.name} · ${name}`, participant_ids: participantIds, creator_id: getActiveLocalProfileId(), community_id: communityId, room_id: roomId, retention_days: 7, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString(), unread_by: unreadBy, last_message: 'Aula creada en modo local' });
    draft.messages[conversationId] = [];
  }, 'community-room-chat');
  audit('room_create', 'school_room', roomId, name);
  notifyUsers(participantIds.filter(id => id !== getActiveLocalProfileId()), { title: 'Nueva aula escolar', body: `${name} ya está disponible.`, page: 'community' });
  return roomId;
}

export async function uploadLocalCommunityDocument(communityId, file, values = {}) {
  if (!file) throw new Error('Selecciona un archivo.');
  if (file.size > 20 * 1024 * 1024) throw new Error('El archivo supera el máximo de 20 MB.');
  const state = readLocalCommunityState();
  const membership = currentMembership(state, communityId);
  if (!membership || membership.status !== 'active') throw new Error('Debes ser miembro activo para subir documentos.');
  const fileId = uid('community-file');
  const documentId = uid('local-document');
  await putLocalFile(fileId, file);
  mutateCommunity(draft => {
    draft.documents.unshift({ id: documentId, community_id: communityId, uploader_id: getActiveLocalProfileId(), title: String(values.title || '').trim() || file.name, file_name: file.name, storage_path: `local:${fileId}`, local_file_id: fileId, mime_type: file.type || 'application/octet-stream', size_bytes: file.size, visibility: values.visibility || 'members', created_at: new Date().toISOString() });
  }, 'community-document');
  audit('community_document_upload', 'community_document', documentId, file.name);
  return documentId;
}

export async function openLocalCommunityDocument(documentRow) {
  if (documentRow.demo || !documentRow.local_file_id) throw new Error('Este archivo de ejemplo no contiene datos descargables. Sube un archivo real para probar la descarga.');
  const record = await getLocalFile(documentRow.local_file_id);
  if (!record?.blob) throw new Error('El archivo ya no está disponible en este dispositivo.');
  const url = URL.createObjectURL(record.blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = record.name || documentRow.file_name || 'archivo';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
  return true;
}

export function reviewLocalMembership(communityId, userId, status, role = 'member') {
  const state = readLocalCommunityState();
  if (!canManageCommunity(state, communityId)) throw new Error('No tienes permiso para administrar integrantes.');
  if (!['active', 'rejected', 'blocked'].includes(status)) throw new Error('Estado inválido.');
  if (!['admin', 'moderator', 'teacher', 'parent', 'student', 'member'].includes(role)) throw new Error('Rol inválido.');
  let communityName = '';
  mutateCommunity(draft => {
    const community = draft.communities.find(item => item.id === communityId);
    communityName = community?.name || 'la comunidad';
    const membership = draft.memberships.find(item => item.community_id === communityId && item.user_id === userId);
    if (!membership) throw new Error('La solicitud ya no existe.');
    if (membership.role === 'owner') throw new Error('No se puede modificar al propietario.');
    membership.status = status;
    membership.role = role;
    membership.joined_at = status === 'active' ? membership.joined_at || new Date().toISOString() : membership.joined_at;
    membership.updated_at = new Date().toISOString();
  }, 'community-member-review');
  audit('community_member_review', 'community_member', `${communityId}:${userId}`, `${status}/${role}`);
  notifyUsers([userId], { title: 'Membresía actualizada', body: `${communityName}: ${status === 'active' ? 'tu ingreso fue aprobado' : 'estado ' + status}.` });
  return true;
}

export function resetLocalCommunityData() {
  localStorage.removeItem(COMMUNITY_KEY);
  writeLocalCommunityState(seedCommunityState(), 'community-reset');
  return true;
}
