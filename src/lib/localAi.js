import { getActiveLocalProfile, getActiveLocalProfileId, listLocalProfiles, mutateLocalState, readLocalState } from './localStore';
import { readLocalCommunityState } from './localCommunity';
import { readLocalBenefitsState } from './localBenefits';
import { readLocalCommerceState } from './localCommerce';
import { readLocalCampusState } from './localCampus';
import { readLocalBusinessState } from './localBusiness';
import { readLocalRideState } from './localRide';

const STATE_KEY = 'mizona-v8-local-ai-v21';
const CHANGE_EVENT = 'mizona:local-ai-change';
const CHANNEL_NAME = 'mizona-v8-ai-v21';
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const nowIso = () => new Date().toISOString();
const arr = value => Array.isArray(value) ? value : [];

const starterMessages = [
  {
    id: 'ai-msg-welcome', role: 'assistant', specialist: 'general',
    text: 'Hola José. Soy IA MiZona en modo local. Puedo revisar los módulos guardados en este navegador y ayudarte a convertir una necesidad en pasos concretos.',
    source: 'local', created_at: nowIso(), actions: [{ page: 'panel', label: 'Abrir Mi Panel' }]
  }
];

function seedState() {
  return {
    version: 21,
    conversations: [
      {
        id: 'ai-conv-jose', user_id: 'local-user-jose', title: 'Primeros pasos con IA MiZona',
        specialist: 'general', messages: clone(starterMessages), created_at: nowIso(), updated_at: nowIso()
      }
    ],
    saved_plans: [],
    favorites: [],
    feedback: [],
    flagged_prompts: [],
    usage: [],
    settings: {
      local_enabled: true,
      external_endpoint_enabled: true,
      allow_student_access: false,
      retain_days: 30,
      max_prompt_chars: 1200,
      safety_notice: 'No escribas contraseñas, datos bancarios ni información privada de menores.'
    },
    updated_at: nowIso()
  };
}

function migrate(input) {
  const next = input && typeof input === 'object' ? input : seedState();
  next.version = 21;
  for (const key of ['conversations','saved_plans','favorites','feedback','flagged_prompts','usage']) next[key] = arr(next[key]);
  next.settings = { ...seedState().settings, ...(next.settings || {}) };
  next.updated_at = next.updated_at || nowIso();
  return next;
}

export function readLocalAiState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    const next = migrate(parsed);
    if (!parsed) localStorage.setItem(STATE_KEY, JSON.stringify(next));
    return clone(next);
  } catch {
    const fresh = seedState();
    localStorage.setItem(STATE_KEY, JSON.stringify(fresh));
    return clone(fresh);
  }
}

function writeState(next, reason = 'ai-update') {
  const state = migrate(next);
  state.updated_at = nowIso();
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { reason } }));
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ reason, updated_at: state.updated_at });
    channel.close();
  } catch {}
  return clone(state);
}

function mutateState(fn, reason) {
  const draft = readLocalAiState();
  fn(draft);
  return writeState(draft, reason);
}

export function subscribeLocalAi(callback) {
  const handler = event => callback?.(event.detail || { reason: 'local' });
  const storage = event => { if (event.key === STATE_KEY) callback?.({ reason: 'storage' }); };
  let channel = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = event => callback?.(event.data || { reason: 'broadcast' });
  } catch {}
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storage);
    channel?.close();
  };
}

function safeRead(reader, fallback = {}) {
  try { return reader(); } catch { return fallback; }
}

function profileName(id) {
  const p = listLocalProfiles().find(item => item.id === id);
  return p?.displayName || p?.display_name || p?.username || 'Usuario';
}

export function getLocalAiContext() {
  const user = getActiveLocalProfile();
  const core = safeRead(readLocalState, {});
  const community = safeRead(readLocalCommunityState, {});
  const benefits = safeRead(readLocalBenefitsState, {});
  const commerce = safeRead(readLocalCommerceState, {});
  const campus = safeRead(readLocalCampusState, {});
  const business = safeRead(readLocalBusinessState, {});
  const ride = safeRead(readLocalRideState, {});

  const memberships = arr(community.memberships).filter(item => item.user_id === user.id && item.status === 'active');
  const userCommunities = arr(community.communities).filter(item => memberships.some(m => m.community_id === item.id) || item.owner_id === user.id);
  const activeBenefits = arr(benefits.opportunities).filter(item => item.status === 'active');
  const activeBusinesses = arr(commerce.businesses).filter(item => item.status === 'active');
  const activeListings = arr(commerce.listings).filter(item => item.status === 'active');
  const enrollments = arr(campus.enrollments).filter(item => item.user_id === user.id);
  const businessWorkspaces = arr(business.businesses).filter(item => item.owner_id === user.id || arr(business.workers).some(w => w.business_id === item.id && w.user_id === user.id && w.status === 'active'));
  const rides = arr(ride.rides).filter(item => item.passenger_id === user.id);
  const deliveries = arr(ride.deliveries).filter(item => item.customer_id === user.id);
  const today = new Date();
  const salesToday = arr(business.sales).filter(item => {
    const date = new Date(item.created_at);
    return businessWorkspaces.some(b => b.id === item.business_id) && date.toDateString() === today.toDateString();
  });

  return {
    user: {
      id: user.id,
      display_name: user.displayName,
      username: user.username,
      zone: user.zone,
      role: user.role,
      account_type: user.accountType,
      school_role: user.schoolRole
    },
    counts: {
      communities: userCommunities.length,
      announcements: arr(community.announcements).filter(item => userCommunities.some(c => c.id === item.community_id)).length,
      events: arr(community.events).filter(item => userCommunities.some(c => c.id === item.community_id)).length,
      notifications_unread: arr(core.notifications).filter(item => item.user_id === user.id && !item.read).length,
      conversations: arr(core.conversations).filter(item => arr(item.participant_ids).includes(user.id)).length,
      benefits: activeBenefits.length,
      businesses: activeBusinesses.length,
      marketplace: activeListings.length,
      courses_enrolled: enrollments.length,
      business_workspaces: businessWorkspaces.length,
      rides: rides.length,
      deliveries: deliveries.length
    },
    highlights: {
      communities: userCommunities.slice(0, 5).map(item => item.name),
      benefits: activeBenefits.slice(0, 5).map(item => item.title),
      businesses: activeBusinesses.slice(0, 5).map(item => item.name),
      listings: activeListings.slice(0, 5).map(item => item.title),
      courses: arr(campus.courses).filter(item => enrollments.some(e => e.course_id === item.id)).slice(0, 5).map(item => item.title),
      business_sales_today: Number(salesToday.reduce((sum, item) => sum + Number(item.total || 0), 0).toFixed(2)),
      latest_notifications: arr(core.notifications).filter(item => item.user_id === user.id).slice(0, 5).map(item => item.title)
    }
  };
}

function isAdmin(profile = getActiveLocalProfile()) {
  return ['admin','super_admin'].includes(profile?.role);
}

function isStudent(profile = getActiveLocalProfile()) {
  return profile?.accountType === 'student' || profile?.account_type === 'student' || profile?.schoolRole === 'student' || profile?.school_role === 'student';
}

function safetyCheck(prompt) {
  const text = String(prompt || '').toLowerCase();
  const severe = [
    'contraseña', 'password', 'clave bancaria', 'número de tarjeta', 'cvv', 'código de verificación',
    'datos privados de un menor', 'dirección exacta de un niño', 'hackear', 'robar cuenta', 'fabricar arma'
  ];
  const sensitive = severe.find(term => text.includes(term));
  if (sensitive) return { blocked: true, reason: `Detecté contenido sensible relacionado con “${sensitive}”. No compartas ese dato. Puedo ayudarte con una alternativa segura.` };
  return { blocked: false, reason: '' };
}

function actionable(text, specialist, context) {
  const t = text.toLowerCase();
  if (specialist === 'community' || /comunidad|comité|reunión|vecino|evento|comunicado|acta|gasto/.test(t)) {
    return {
      title: 'Plan para Comunidad o Comité',
      answer: `En tu cuenta aparecen ${context.counts.communities} comunidades y ${context.counts.announcements} comunicados. Te recomiendo: 1) definir objetivo, responsable y fecha; 2) publicar el comunicado; 3) registrar acuerdos o gastos con sustento; 4) compartir el enlace; 5) cerrar con un resumen para los miembros.`,
      actions: [{ page: 'community', label: 'Abrir Mi Comunidad' }, { page: 'committees', label: 'Abrir Comités' }],
      checklist: ['Definir objetivo y responsables', 'Crear comunicado o evento', 'Adjuntar sustento', 'Compartir con miembros', 'Registrar el cierre']
    };
  }
  if (specialist === 'business' || /negocio|venta|caja|inventario|producto|cliente|oferta|igv|boleta/.test(t)) {
    const sales = context.highlights.business_sales_today;
    return {
      title: 'Plan de negocio',
      answer: `Tienes acceso a ${context.counts.business_workspaces} espacios de MiZona Business. Las ventas locales registradas hoy suman S/ ${sales.toFixed(2)}. Empieza revisando caja, productos con stock bajo y pedidos pendientes; luego crea una promoción medible y compara resultados al cierre.`,
      actions: [{ page: 'business', label: 'Abrir MiZona Business' }, { page: 'benefits', label: 'Crear beneficio' }],
      checklist: ['Revisar caja abierta', 'Detectar stock bajo', 'Elegir producto objetivo', 'Crear promoción', 'Medir ventas y margen']
    };
  }
  if (specialist === 'education' || /curso|excel|estudiar|aprender|tarea|evaluación|campus/.test(t)) {
    const names = context.highlights.courses.length ? context.highlights.courses.join(', ') : 'ningún curso todavía';
    return {
      title: 'Ruta de aprendizaje',
      answer: `Actualmente tienes ${context.counts.courses_enrolled} cursos inscritos (${names}). Trabaja en bloques cortos: explicación, práctica, revisión y evaluación. Para Excel: interfaz y celdas, fórmulas, tablas, filtros, gráficos y tablas dinámicas.`,
      actions: [{ page: 'campus', label: 'Abrir CampusHugo' }],
      checklist: ['Elegir objetivo semanal', 'Completar una lección', 'Resolver una práctica', 'Revisar errores', 'Rendir evaluación']
    };
  }
  if (specialist === 'local' || /cerca|zona|beneficio|descuento|empleo|marketplace|servicio|tienda/.test(t)) {
    return {
      title: 'Explorar la zona',
      answer: `En este navegador hay ${context.counts.benefits} beneficios activos, ${context.counts.businesses} negocios y ${context.counts.marketplace} publicaciones de Marketplace. Filtra por tu zona (${context.user.zone}), verifica vigencia y reputación, y conversa siempre dentro de MiZona Chat.`,
      actions: [{ page: 'benefits', label: 'Ver Beneficios' }, { page: 'businesses', label: 'Ver Negocios' }, { page: 'marketplace', label: 'Abrir Marketplace' }],
      checklist: ['Filtrar por zona', 'Revisar vigencia', 'Verificar reputación', 'Contactar por Chat', 'Reportar anomalías']
    };
  }
  if (specialist === 'ride' || /viaje|ride|taxi|delivery|envío|conductor|moto|auto/.test(t)) {
    return {
      title: 'Viaje o envío seguro',
      answer: `Tienes ${context.counts.rides} viajes y ${context.counts.deliveries} envíos registrados localmente. Confirma origen, destino y tarifa; verifica conductor, placa y código; comparte el estado con un contacto de confianza y califica al finalizar.`,
      actions: [{ page: 'ride', label: 'Abrir MiZona Ride' }],
      checklist: ['Confirmar origen y destino', 'Verificar conductor y placa', 'Usar código de seguridad', 'No compartir claves', 'Calificar al finalizar']
    };
  }
  if (/notificación|mensaje|chat|grupo|archivo/.test(t)) {
    return {
      title: 'Comunicación segura',
      answer: `Tienes ${context.counts.conversations} conversaciones y ${context.counts.notifications_unread} notificaciones sin leer. Revisa primero solicitudes pendientes, usa grupos solo con miembros necesarios y evita enviar datos bancarios o información privada de menores.`,
      actions: [{ page: 'chat', label: 'Abrir MiZona Chat' }, { page: 'notifications', label: 'Ver Notificaciones' }],
      checklist: ['Revisar solicitudes', 'Confirmar participantes', 'Evitar datos sensibles', 'Usar archivos temporales', 'Reportar contenido sospechoso']
    };
  }
  return {
    title: 'Ruta recomendada en MiZona',
    answer: `Puedo orientarte usando los datos locales de esta cuenta. Ahora tienes ${context.counts.communities} comunidades, ${context.counts.conversations} conversaciones, ${context.counts.benefits} beneficios, ${context.counts.courses_enrolled} cursos y ${context.counts.business_workspaces} negocios administrables. Describe el resultado que deseas y el tiempo disponible para darte un plan más preciso.`,
    actions: [{ page: 'panel', label: 'Abrir Mi Panel' }],
    checklist: ['Definir el resultado', 'Elegir el módulo', 'Asignar responsables', 'Ejecutar', 'Revisar resultados']
  };
}

function notify(userId, title, body, page = 'ai') {
  mutateLocalState(draft => {
    draft.notifications.unshift({ id: uid('not-ai'), user_id: userId, type: 'ai', title, body, page, read: false, created_at: nowIso() });
    draft.notifications = draft.notifications.slice(0, 500);
    draft.auditLogs.unshift({ id: uid('audit-ai'), actor_id: userId, action: 'ai_activity', entity_type: 'ai', entity_id: page, detail: title, created_at: nowIso() });
    draft.syncQueue.unshift({ id: uid('sync-ai'), user_id: userId, action: 'ai_activity', entity_type: 'ai', entity_id: page, payload: { title }, status: 'pending', created_at: nowIso() });
    return draft;
  }, 'ai-notification');
}

export function getLocalAiSnapshot(userId = getActiveLocalProfileId()) {
  const state = readLocalAiState();
  const conversations = state.conversations
    .filter(item => item.user_id === userId)
    .sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  return {
    state,
    conversations,
    savedPlans: state.saved_plans.filter(item => item.user_id === userId),
    favorites: state.favorites.filter(item => item.user_id === userId),
    usage: state.usage.filter(item => item.user_id === userId),
    flagged: isAdmin() ? state.flagged_prompts : state.flagged_prompts.filter(item => item.user_id === userId),
    settings: state.settings,
    context: getLocalAiContext()
  };
}

export function createLocalAiConversation({ title = 'Nueva conversación', specialist = 'general' } = {}) {
  const userId = getActiveLocalProfileId();
  const id = uid('ai-conv');
  mutateState(state => {
    state.conversations.unshift({ id, user_id: userId, title: String(title || 'Nueva conversación').trim().slice(0, 80), specialist, messages: [], created_at: nowIso(), updated_at: nowIso() });
  }, 'ai-conversation-create');
  return id;
}

export function deleteLocalAiConversation(conversationId) {
  const userId = getActiveLocalProfileId();
  mutateState(state => {
    const row = state.conversations.find(item => item.id === conversationId);
    if (!row) return;
    if (row.user_id !== userId && !isAdmin()) throw new Error('No puedes eliminar esta conversación.');
    state.conversations = state.conversations.filter(item => item.id !== conversationId);
  }, 'ai-conversation-delete');
  return true;
}

export async function askLocalAi({ conversationId, prompt, specialist = 'general', endpoint = '' }) {
  const profile = getActiveLocalProfile();
  if (isStudent(profile) && !readLocalAiState().settings.allow_student_access) throw new Error('IA MiZona está desactivada para cuentas estudiantiles.');
  const clean = String(prompt || '').trim();
  const settings = readLocalAiState().settings;
  if (!clean) throw new Error('Escribe una consulta.');
  if (clean.length > Number(settings.max_prompt_chars || 1200)) throw new Error(`La consulta supera ${settings.max_prompt_chars} caracteres.`);

  const check = safetyCheck(clean);
  const userId = profile.id;
  const convId = conversationId || createLocalAiConversation({ title: clean.slice(0, 60), specialist });
  const userMessage = { id: uid('ai-msg'), role: 'user', text: clean, specialist, created_at: nowIso() };

  mutateState(state => {
    const conv = state.conversations.find(item => item.id === convId);
    if (!conv || conv.user_id !== userId) throw new Error('Conversación no encontrada.');
    conv.specialist = specialist;
    if (!conv.messages.length || conv.title === 'Nueva conversación') conv.title = clean.slice(0, 70);
    conv.messages.push(userMessage);
    conv.updated_at = nowIso();
    state.usage.unshift({ id: uid('ai-use'), user_id: userId, conversation_id: convId, specialist, source: endpoint ? 'endpoint_attempt' : 'local', created_at: nowIso() });
    if (check.blocked) state.flagged_prompts.unshift({ id: uid('ai-flag'), user_id: userId, conversation_id: convId, prompt: clean.slice(0, 300), reason: check.reason, status: 'blocked', created_at: nowIso() });
  }, 'ai-question');

  if (!settings.local_enabled && (!endpoint || !settings.external_endpoint_enabled)) {
    throw new Error('IA MiZona está desactivada por el administrador.');
  }

  let payload;
  let answerSource = 'local';
  if (check.blocked) {
    payload = { title: 'Protección de datos', answer: check.reason, actions: [{ page: 'settings', label: 'Revisar privacidad' }], checklist: ['No compartir el dato', 'Cambiar claves si fueron expuestas', 'Usar canales oficiales'] };
  } else {
    const context = getLocalAiContext();
    payload = actionable(clean, specialist, context);
    if (endpoint && settings.external_endpoint_enabled) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: clean,
            specialist,
            context: { counts: context.counts, highlights: context.highlights, zone: context.user.zone, account_type: context.user.account_type },
            privacy: 'No se incluyen contraseñas, correos ni contenido privado de chats.'
          })
        });
        if (!response.ok) throw new Error('El servidor de IA no respondió.');
        const remote = await response.json();
        if (remote?.answer || remote?.message) {
          payload = { ...payload, answer: remote.answer || remote.message, title: remote.title || payload.title, actions: arr(remote.actions).length ? remote.actions : payload.actions };
          answerSource = 'endpoint';
        }
      } catch (error) {
        if (!settings.local_enabled) throw new Error('El endpoint de IA no respondió y el respaldo local está desactivado.');
      }
    } else if (!settings.local_enabled) {
      throw new Error('El motor local está desactivado y no hay un endpoint externo disponible.');
    }
  }

  const assistantMessage = {
    id: uid('ai-msg'), role: 'assistant', text: payload.answer, title: payload.title,
    specialist, source: check.blocked ? 'safety' : answerSource,
    actions: payload.actions, checklist: payload.checklist, created_at: nowIso()
  };

  mutateState(state => {
    const conv = state.conversations.find(item => item.id === convId);
    if (!conv) return;
    conv.messages.push(assistantMessage);
    conv.updated_at = nowIso();
  }, 'ai-answer');
  return { conversationId: convId, message: assistantMessage };
}

export function saveLocalAiPlan(conversationId, messageId) {
  const userId = getActiveLocalProfileId();
  let saved = null;
  mutateState(state => {
    const conv = state.conversations.find(item => item.id === conversationId && item.user_id === userId);
    const message = conv?.messages.find(item => item.id === messageId && item.role === 'assistant');
    if (!message) throw new Error('No se encontró la respuesta.');
    const existing = state.saved_plans.find(item => item.user_id === userId && item.message_id === messageId);
    if (existing) { saved = existing; return; }
    saved = { id: uid('ai-plan'), user_id: userId, conversation_id: conversationId, message_id: messageId, title: message.title || conv.title, body: message.text, checklist: arr(message.checklist), created_at: nowIso() };
    state.saved_plans.unshift(saved);
  }, 'ai-plan-save');
  notify(userId, 'Plan guardado', saved?.title || 'Respuesta de IA MiZona', 'ai');
  return saved;
}

export function deleteLocalAiPlan(planId) {
  const userId = getActiveLocalProfileId();
  mutateState(state => { state.saved_plans = state.saved_plans.filter(item => !(item.id === planId && (item.user_id === userId || isAdmin()))); }, 'ai-plan-delete');
  return true;
}

export function toggleLocalAiFavorite(prompt) {
  const userId = getActiveLocalProfileId();
  const clean = String(prompt || '').trim();
  if (!clean) return false;
  let active = false;
  mutateState(state => {
    const index = state.favorites.findIndex(item => item.user_id === userId && item.prompt.toLowerCase() === clean.toLowerCase());
    if (index >= 0) state.favorites.splice(index, 1);
    else { state.favorites.unshift({ id: uid('ai-fav'), user_id: userId, prompt: clean, created_at: nowIso() }); active = true; }
  }, 'ai-favorite');
  return active;
}

export function rateLocalAiMessage(conversationId, messageId, value, comment = '') {
  const userId = getActiveLocalProfileId();
  mutateState(state => {
    const existing = state.feedback.find(item => item.user_id === userId && item.message_id === messageId);
    const row = { id: existing?.id || uid('ai-feedback'), user_id: userId, conversation_id: conversationId, message_id: messageId, value: value === 'up' ? 'up' : 'down', comment: String(comment || '').trim(), created_at: nowIso() };
    if (existing) Object.assign(existing, row); else state.feedback.unshift(row);
  }, 'ai-feedback');
  return true;
}

export function updateLocalAiSettings(values) {
  if (!isAdmin()) throw new Error('Solo un administrador puede cambiar la configuración de IA.');
  mutateState(state => { state.settings = { ...state.settings, ...values }; }, 'ai-settings');
  return true;
}

export function reviewLocalAiFlag(flagId, status) {
  if (!isAdmin()) throw new Error('Solo un administrador puede revisar alertas.');
  mutateState(state => {
    const row = state.flagged_prompts.find(item => item.id === flagId);
    if (!row) throw new Error('Alerta no encontrada.');
    row.status = status;
    row.reviewed_at = nowIso();
    row.reviewed_by = getActiveLocalProfileId();
  }, 'ai-flag-review');
  return true;
}

export function resetLocalAi() {
  if (!isAdmin()) throw new Error('Solo un administrador puede restablecer IA MiZona.');
  localStorage.removeItem(STATE_KEY);
  writeState(seedState(), 'ai-reset');
  return true;
}

export function localAiUserLabel(userId) {
  return profileName(userId);
}
