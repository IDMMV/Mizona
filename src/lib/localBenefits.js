import {
  getActiveLocalProfile,
  getActiveLocalProfileId,
  mutateLocalState,
  readLocalState
} from './localStore';

const STATE_KEY = 'mizona-v8-local-benefits-v16';
const CHANGE_EVENT = 'mizona:local-benefits-change';
const CHANNEL_NAME = 'mizona-v8-benefits-v16';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const iso = value => new Date(value).toISOString();
const now = Date.now();

const seedOpportunities = [
  {
    id: 'off-1', type: 'offers', title: 'Combo familiar de pollo', owner_id: 'local-maria', owner_name: 'Pollería El Buen Sabor', zone: 'Pachacútec', distance: '650 m', badge: '35% menos', price: 'S/ 49.90', previous: 'S/ 76.00', expires_at: iso(now + 2 * 86400000), image: '🍗', verified: true, status: 'active', action_label: 'Ver oferta', description: '1 pollo, papas, ensalada y gaseosa de 1.5 L. Stock limitado a 25 combos.', stock: 25, views: 1260, action_count: 184, created_at: iso(now - 4 * 86400000), updated_at: iso(now - 2 * 3600000)
  },
  {
    id: 'off-2', type: 'offers', title: 'Balón de gas con reparto', owner_id: 'local-carlos', owner_name: 'Gas Ventanilla', zone: 'Ventanilla', distance: '1.2 km', badge: 'Ahorra S/ 8', price: 'S/ 46.00', previous: 'S/ 54.00', expires_at: iso(now + 3 * 86400000), image: '🔥', verified: true, status: 'active', action_label: 'Solicitar', description: 'Precio final con reparto en sectores habilitados. Confirma cobertura antes de pagar.', stock: 40, views: 840, action_count: 92, created_at: iso(now - 3 * 86400000), updated_at: iso(now - 3 * 3600000)
  },
  {
    id: 'job-1', type: 'jobs', title: 'Auxiliar de caja', owner_id: 'local-maria', owner_name: 'Mercado Central Pachacútec', zone: 'Pachacútec', distance: '900 m', badge: 'Tiempo completo', price: 'S/ 1,350', previous: null, expires_at: iso(now + 5 * 86400000), image: '🧾', verified: true, status: 'active', action_label: 'Postular', description: 'Se requiere disponibilidad inmediata. Experiencia deseable, no indispensable.', stock: 2, views: 610, action_count: 47, created_at: iso(now - 2 * 86400000), updated_at: iso(now - 4 * 3600000)
  },
  {
    id: 'event-1', type: 'events', title: 'Feria escolar y científica', owner_id: 'local-teacher', owner_name: 'Colegio San Martín', zone: 'Pachacútec', distance: '1.1 km', badge: 'Entrada libre', price: 'Sábado 10:00 a. m.', previous: null, expires_at: iso(now + 4 * 86400000), image: '🔬', verified: true, status: 'active', action_label: 'Asistiré', description: 'Exposición de proyectos, concursos, gastronomía y actividades familiares.', stock: 300, views: 920, action_count: 151, created_at: iso(now - 2 * 86400000), updated_at: iso(now - 6 * 3600000)
  },
  {
    id: 'campaign-1', type: 'campaigns', title: 'Campaña médica gratuita', owner_id: 'local-user-jose', owner_name: 'Centro de Salud Pachacútec', zone: 'Pachacútec', distance: '700 m', badge: 'Gratis', price: 'Medicina general', previous: null, expires_at: iso(now + 7 * 86400000), image: '🩺', verified: true, status: 'active', action_label: 'Reservar turno', description: 'Atención general, descarte de anemia y orientación nutricional. Cupos limitados.', stock: 80, views: 780, action_count: 110, created_at: iso(now - 5 * 86400000), updated_at: iso(now - 8 * 3600000)
  },
  {
    id: 'coupon-1', type: 'coupons', title: '2x1 en entradas infantiles', owner_id: 'local-valery', owner_name: 'Cine Plaza Ventanilla', zone: 'Ventanilla', distance: '4.1 km', badge: 'Cupón MiZona', price: '2x1', previous: null, expires_at: iso(now + 12 * 86400000), image: '🎬', verified: true, status: 'active', action_label: 'Obtener cupón', description: 'Válido para funciones 2D antes de las 6:00 p. m. No acumulable.', stock: 100, views: 430, action_count: 68, created_at: iso(now - 6 * 86400000), updated_at: iso(now - 10 * 3600000)
  },
  {
    id: 'pending-1', type: 'offers', title: 'Descuento en mantenimiento de bicicletas', owner_id: 'local-carlos', owner_name: 'Taller Pedal Seguro', zone: 'Ventanilla', distance: '2 km', badge: '20% menos', price: 'Desde S/ 25', previous: null, expires_at: iso(now + 15 * 86400000), image: '🚲', verified: false, status: 'pending', action_label: 'Solicitar', description: 'Revisión general, ajuste de frenos y lubricación. Publicación pendiente de revisión.', stock: 20, views: 0, action_count: 0, created_at: iso(now - 2 * 3600000), updated_at: iso(now - 2 * 3600000)
  }
];

function seedState() {
  return {
    version: 16,
    opportunities: clone(seedOpportunities),
    favorites: [
      { id: 'fav-jose-off1', user_id: 'local-user-jose', opportunity_id: 'off-1', created_at: iso(now - 2 * 86400000) },
      { id: 'fav-jose-coupon1', user_id: 'local-user-jose', opportunity_id: 'coupon-1', created_at: iso(now - 86400000) }
    ],
    actions: [
      { id: 'action-demo-coupon', user_id: 'local-user-jose', opportunity_id: 'coupon-1', action_type: 'coupon', status: 'active', coupon_code: 'MZ-2X1-JOSE', created_at: iso(now - 6 * 3600000) }
    ],
    reports: [],
    updated_at: new Date().toISOString()
  };
}

function migrateState(state) {
  const next = state && typeof state === 'object' ? state : seedState();
  next.version = 16;
  next.opportunities = Array.isArray(next.opportunities) ? next.opportunities : clone(seedOpportunities);
  next.favorites = Array.isArray(next.favorites) ? next.favorites : [];
  next.actions = Array.isArray(next.actions) ? next.actions : [];
  next.reports = Array.isArray(next.reports) ? next.reports : [];
  next.updated_at = next.updated_at || new Date().toISOString();
  return next;
}

export function readLocalBenefitsState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    const migrated = migrateState(parsed);
    if (!parsed) localStorage.setItem(STATE_KEY, JSON.stringify(migrated));
    return clone(migrated);
  } catch {
    const fresh = seedState();
    localStorage.setItem(STATE_KEY, JSON.stringify(fresh));
    return clone(fresh);
  }
}

function writeState(next, reason = 'benefits-update') {
  const state = migrateState(next);
  state.updated_at = new Date().toISOString();
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason, updated_at: state.updated_at } }));
  channel?.postMessage({ reason, updated_at: state.updated_at });
  return clone(state);
}

function mutateState(mutator, reason) {
  const state = readLocalBenefitsState();
  mutator(state);
  return writeState(state, reason);
}

export function subscribeLocalBenefits(callback) {
  const handler = () => callback(readLocalBenefitsState());
  const storageHandler = event => { if (event.key === STATE_KEY) handler(); };
  const channelHandler = () => handler();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  channel?.addEventListener('message', channelHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
    channel?.removeEventListener('message', channelHandler);
  };
}

function isAdmin(profile = getActiveLocalProfile()) {
  return ['admin', 'super_admin'].includes(profile?.role);
}

function addCoreAudit(action, entityType, entityId, detail = '', payload = {}) {
  const profile = getActiveLocalProfile();
  mutateLocalState(draft => {
    draft.auditLogs = Array.isArray(draft.auditLogs) ? draft.auditLogs : [];
    draft.syncQueue = Array.isArray(draft.syncQueue) ? draft.syncQueue : [];
    draft.auditLogs.unshift({ id: uid('audit-benefit'), actor_id: profile.id, action, entity_type: entityType, entity_id: entityId, detail, created_at: new Date().toISOString() });
    draft.syncQueue.unshift({ id: uid('sync-benefit'), action, entity_type: entityType, entity_id: entityId, payload, status: 'local_only', created_at: new Date().toISOString() });
  }, `benefit-${action}`);
}

function notifyUsers(userIds, { title, body, page = 'benefits', type = 'benefit' }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return;
  mutateLocalState(draft => {
    draft.notifications = Array.isArray(draft.notifications) ? draft.notifications : [];
    ids.forEach(userId => draft.notifications.unshift({ id: uid('not-benefit'), user_id: userId, type, title, body, page, read: false, created_at: new Date().toISOString() }));
  }, 'benefit-notification');
}

function adminIds() {
  return (readLocalState().directory || []).filter(item => ['admin', 'super_admin'].includes(item.role) && item.status === 'active').map(item => item.id);
}

function actionTypeFor(opportunity) {
  if (opportunity.type === 'coupons') return 'coupon';
  if (opportunity.type === 'jobs') return 'application';
  if (opportunity.type === 'events') return 'attendance';
  if (opportunity.type === 'campaigns') return 'participation';
  return 'request';
}

function defaultActionLabel(type) {
  return ({ offers: 'Ver oferta', jobs: 'Postular', events: 'Asistiré', campaigns: 'Participar', coupons: 'Obtener cupón' })[type] || 'Me interesa';
}

export function getLocalBenefitsSnapshot() {
  const state = readLocalBenefitsState();
  const profile = getActiveLocalProfile();
  const current = Date.now();
  const visible = state.opportunities.filter(item => {
    const expired = item.expires_at && new Date(item.expires_at).getTime() < current;
    if (expired && item.status === 'active') item.status = 'expired';
    return item.status === 'active' || item.owner_id === profile.id || isAdmin(profile);
  });
  return {
    ...state,
    opportunities: visible,
    myFavoriteIds: state.favorites.filter(item => item.user_id === profile.id).map(item => item.opportunity_id),
    myActions: state.actions.filter(item => item.user_id === profile.id),
    myPublications: state.opportunities.filter(item => item.owner_id === profile.id),
    pendingCount: state.opportunities.filter(item => item.status === 'pending').length,
    reportPendingCount: state.reports.filter(item => item.status === 'pending').length
  };
}

export function createLocalOpportunity(values) {
  const profile = getActiveLocalProfile();
  if (profile.accountType === 'student') throw new Error('Las cuentas de estudiante no pueden publicar oportunidades públicas.');
  const title = String(values.title || '').trim();
  const description = String(values.description || '').trim();
  const type = String(values.type || 'offers');
  if (!['offers', 'jobs', 'events', 'campaigns', 'coupons'].includes(type)) throw new Error('Categoría inválida.');
  if (title.length < 4) throw new Error('El título debe tener al menos 4 caracteres.');
  if (description.length < 10) throw new Error('La descripción debe tener al menos 10 caracteres.');
  if (!values.expiresAt) throw new Error('Selecciona una fecha de vencimiento.');
  const expiresAt = new Date(values.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) throw new Error('La fecha de vencimiento debe ser futura.');
  const opportunity = {
    id: uid('benefit'),
    type,
    title,
    owner_id: profile.id,
    owner_name: String(values.ownerName || profile.displayName || profile.username).trim(),
    zone: String(values.zone || profile.zone || 'Sin zona').trim(),
    distance: 'Zona local',
    badge: String(values.badge || (type === 'coupons' ? 'Cupón MiZona' : 'Nuevo')).trim(),
    price: String(values.price || 'Consultar').trim(),
    previous: String(values.previous || '').trim() || null,
    expires_at: expiresAt.toISOString(),
    image: String(values.image || ({ offers: '🏷️', jobs: '💼', events: '🎉', campaigns: '❤️', coupons: '🎟️' })[type]).trim(),
    verified: isAdmin(profile),
    status: isAdmin(profile) ? 'active' : 'pending',
    action_label: String(values.actionLabel || defaultActionLabel(type)).trim(),
    description,
    stock: Math.max(0, Number(values.stock || 0)),
    views: 0,
    action_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mutateState(state => state.opportunities.unshift(opportunity), 'opportunity-create');
  addCoreAudit('opportunity_create', 'opportunity', opportunity.id, opportunity.title, { status: opportunity.status, type });
  if (opportunity.status === 'pending') notifyUsers(adminIds(), { title: 'Nueva oportunidad pendiente', body: `${profile.displayName} publicó “${opportunity.title}”.` });
  return opportunity;
}

export function updateLocalOpportunity(opportunityId, values) {
  const profile = getActiveLocalProfile();
  let updated;
  mutateState(state => {
    const row = state.opportunities.find(item => item.id === opportunityId);
    if (!row) throw new Error('La publicación no existe.');
    if (row.owner_id !== profile.id && !isAdmin(profile)) throw new Error('No tienes permiso para editar esta publicación.');
    if (values.title !== undefined && String(values.title).trim().length >= 4) row.title = String(values.title).trim();
    if (values.description !== undefined && String(values.description).trim().length >= 10) row.description = String(values.description).trim();
    if (values.price !== undefined) row.price = String(values.price).trim() || 'Consultar';
    if (values.badge !== undefined) row.badge = String(values.badge).trim() || 'Actualizado';
    if (values.stock !== undefined) row.stock = Math.max(0, Number(values.stock || 0));
    if (values.expiresAt) row.expires_at = new Date(values.expiresAt).toISOString();
    if (!isAdmin(profile)) {
      row.status = 'pending';
      row.verified = false;
    }
    row.updated_at = new Date().toISOString();
    updated = clone(row);
  }, 'opportunity-update');
  addCoreAudit('opportunity_update', 'opportunity', opportunityId, updated?.title || 'Actualización');
  if (!isAdmin(profile)) notifyUsers(adminIds(), { title: 'Oportunidad actualizada', body: `${profile.displayName} envió cambios para revisión.` });
  return updated;
}

export function toggleLocalFavorite(opportunityId) {
  const userId = getActiveLocalProfileId();
  let saved = false;
  mutateState(state => {
    const index = state.favorites.findIndex(item => item.user_id === userId && item.opportunity_id === opportunityId);
    if (index >= 0) state.favorites.splice(index, 1);
    else {
      state.favorites.unshift({ id: uid('favorite'), user_id: userId, opportunity_id: opportunityId, created_at: new Date().toISOString() });
      saved = true;
    }
  }, 'favorite-toggle');
  addCoreAudit(saved ? 'opportunity_favorite_add' : 'opportunity_favorite_remove', 'opportunity', opportunityId);
  return saved;
}

export function registerLocalOpportunityView(opportunityId) {
  mutateState(state => {
    const row = state.opportunities.find(item => item.id === opportunityId);
    if (row) row.views = Number(row.views || 0) + 1;
  }, 'opportunity-view');
}

export function performLocalOpportunityAction(opportunityId) {
  const profile = getActiveLocalProfile();
  const state = readLocalBenefitsState();
  const opportunity = state.opportunities.find(item => item.id === opportunityId);
  if (!opportunity || opportunity.status !== 'active') throw new Error('Esta oportunidad ya no está disponible.');
  if (opportunity.owner_id === profile.id) throw new Error('No puedes registrar una acción sobre tu propia publicación.');
  const actionType = actionTypeFor(opportunity);
  const existing = state.actions.find(item => item.user_id === profile.id && item.opportunity_id === opportunityId && item.status !== 'cancelled');
  if (existing) return existing;
  if (Number(opportunity.stock || 0) === 0 && ['coupon', 'attendance', 'application'].includes(actionType)) throw new Error('Ya no quedan cupos disponibles.');
  const action = {
    id: uid('benefit-action'),
    user_id: profile.id,
    opportunity_id: opportunityId,
    action_type: actionType,
    status: 'active',
    coupon_code: actionType === 'coupon' ? `MZ-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${profile.username.slice(0, 5).toUpperCase()}` : null,
    created_at: new Date().toISOString()
  };
  mutateState(draft => {
    draft.actions.unshift(action);
    const row = draft.opportunities.find(item => item.id === opportunityId);
    row.action_count = Number(row.action_count || 0) + 1;
    if (Number(row.stock || 0) > 0) row.stock -= 1;
    row.updated_at = new Date().toISOString();
  }, 'opportunity-action');
  addCoreAudit('opportunity_action', 'opportunity', opportunityId, `${actionType}${action.coupon_code ? ` · ${action.coupon_code}` : ''}`);
  notifyUsers([opportunity.owner_id], { title: 'Nueva acción en tu publicación', body: `${profile.displayName} realizó: ${opportunity.action_label}.` });
  return action;
}

export function cancelLocalOpportunityAction(actionId) {
  const userId = getActiveLocalProfileId();
  mutateState(state => {
    const action = state.actions.find(item => item.id === actionId && item.user_id === userId);
    if (!action) throw new Error('La acción no existe.');
    if (action.status === 'cancelled') return;
    action.status = 'cancelled';
    action.cancelled_at = new Date().toISOString();
    const row = state.opportunities.find(item => item.id === action.opportunity_id);
    if (row) {
      row.action_count = Math.max(0, Number(row.action_count || 0) - 1);
      if (Number.isFinite(Number(row.stock))) row.stock = Number(row.stock || 0) + 1;
    }
  }, 'opportunity-action-cancel');
  addCoreAudit('opportunity_action_cancel', 'benefit_action', actionId);
  return true;
}

export function reviewLocalOpportunity(opportunityId, status, verified = null) {
  const profile = getActiveLocalProfile();
  if (!isAdmin(profile)) throw new Error('Solo un administrador puede moderar oportunidades.');
  if (!['active', 'pending', 'rejected', 'paused', 'expired'].includes(status)) throw new Error('Estado inválido.');
  let row;
  mutateState(state => {
    const found = state.opportunities.find(item => item.id === opportunityId);
    if (!found) throw new Error('La publicación no existe.');
    found.status = status;
    if (verified !== null) found.verified = Boolean(verified);
    found.reviewed_by = profile.id;
    found.reviewed_at = new Date().toISOString();
    found.updated_at = new Date().toISOString();
    row = clone(found);
  }, 'opportunity-review');
  addCoreAudit('opportunity_review', 'opportunity', opportunityId, `${status} · verificado=${row.verified}`);
  notifyUsers([row.owner_id], { title: 'Publicación revisada', body: `“${row.title}” cambió a estado ${status}.` });
  return row;
}

export function reportLocalOpportunity(opportunityId, reason, details = '') {
  const profile = getActiveLocalProfile();
  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 3) throw new Error('Indica el motivo del reporte.');
  const report = {
    id: uid('benefit-report'),
    reporter_id: profile.id,
    opportunity_id: opportunityId,
    reason: cleanReason,
    details: String(details || '').trim(),
    status: 'pending',
    created_at: new Date().toISOString()
  };
  mutateState(state => state.reports.unshift(report), 'opportunity-report');
  addCoreAudit('opportunity_report', 'opportunity', opportunityId, cleanReason);
  notifyUsers(adminIds(), { title: 'Reporte de oportunidad', body: `${profile.displayName}: ${cleanReason}.`, type: 'moderation' });
  return report;
}

export function reviewLocalOpportunityReport(reportId, status) {
  const profile = getActiveLocalProfile();
  if (!isAdmin(profile)) throw new Error('Solo un administrador puede revisar reportes.');
  if (!['reviewing', 'resolved', 'dismissed'].includes(status)) throw new Error('Estado de reporte inválido.');
  mutateState(state => {
    const report = state.reports.find(item => item.id === reportId);
    if (!report) throw new Error('El reporte no existe.');
    report.status = status;
    report.reviewed_by = profile.id;
    report.reviewed_at = new Date().toISOString();
  }, 'opportunity-report-review');
  addCoreAudit('opportunity_report_review', 'benefit_report', reportId, status);
  return true;
}

export function resetLocalBenefits() {
  writeState(seedState(), 'benefits-reset');
  addCoreAudit('benefits_reset', 'benefits_state', STATE_KEY);
}

export function formatOpportunityExpiry(value) {
  if (!value) return 'Sin vencimiento';
  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  if (diff < 0) return 'Vencida';
  const days = Math.ceil(diff / 86400000);
  if (days === 1) return 'Vence mañana';
  if (days <= 7) return `Vence en ${days} días`;
  return `Hasta ${date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}
