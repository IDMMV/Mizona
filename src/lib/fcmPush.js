import { hasSupabase, supabase } from './supabase';
import { getActiveLocalProfile, mutateLocalState } from './localStore';
import { getCloudState, writeCloudState } from './localCloud';

const FIREBASE_CONFIG = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || '').trim()
};

const VAPID_KEY = String(import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
const FIREBASE_VERSION = '10.12.4';

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function getFirebasePushConfigStatus() {
  const missing = [];
  for (const [key, value] of Object.entries(FIREBASE_CONFIG)) {
    if (!value || value.includes('TU_') || value.includes('__')) missing.push(key);
  }
  if (!VAPID_KEY || VAPID_KEY.includes('TU_') || VAPID_KEY.includes('__')) missing.push('vapidKey');
  return { ready: missing.length === 0, missing, hasSupabase };
}

async function loadFirebaseMessaging() {
  const [{ initializeApp }, { getMessaging, getToken, onMessage }] = await Promise.all([
    import(/* @vite-ignore */ `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
    import(/* @vite-ignore */ `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging.js`)
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const messaging = getMessaging(app);
  return { messaging, getToken, onMessage };
}

async function ensureNotificationPermission() {
  if (!('Notification' in window)) throw new Error('Este navegador no soporta notificaciones.');
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('El permiso de notificaciones no fue concedido.');
  return permission;
}

async function ensureMessagingServiceWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('Este navegador no soporta Service Worker.');
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;
  return registration;
}

function saveTokenLocally({ token, userId, username, deviceLabel = '' }) {
  const state = getCloudState();
  const subscriptions = Array.isArray(state.fcmTokens) ? state.fcmTokens : [];
  const existing = subscriptions.find(item => item.token === token);
  const item = {
    id: existing?.id || uid('fcm'),
    userId,
    username,
    token,
    deviceLabel,
    provider: 'firebase_fcm',
    platform: navigator.userAgent,
    active: true,
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso()
  };
  state.fcmTokens = existing ? subscriptions.map(row => row.token === token ? item : row) : [item, ...subscriptions];
  state.settings = {
    ...(state.settings || {}),
    pushProvider: 'firebase_fcm',
    pushRealEnabled: true,
    browserPermission: Notification.permission,
    lastFcmTokenSavedAt: nowIso()
  };
  writeCloudState(state, 'fcm-token-local');
  return item;
}

async function saveTokenToSupabase(record) {
  if (!hasSupabase || !supabase) return { saved: false, reason: 'Supabase no configurado' };
  const payload = {
    user_id: record.userId,
    username: record.username,
    fcm_token: record.token,
    device_label: record.deviceLabel || null,
    platform: record.platform || null,
    active: true,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('mz_push_tokens').upsert(payload, { onConflict: 'fcm_token' });
  if (error) throw error;
  return { saved: true };
}

export async function activateFirebasePush({ deviceLabel = '' } = {}) {
  const status = getFirebasePushConfigStatus();
  if (!status.ready) {
    throw new Error(`Faltan datos de Firebase: ${status.missing.join(', ')}. Completa .env y public/firebase-messaging-sw.js.`);
  }
  await ensureNotificationPermission();
  const registration = await ensureMessagingServiceWorker();
  const { messaging, getToken } = await loadFirebaseMessaging();
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Firebase no devolvió token. Revisa la clave VAPID y que la web use HTTPS.');
  const profile = getActiveLocalProfile();
  let userId = profile.id;
  if (hasSupabase && supabase) {
    const { data } = await supabase.auth.getUser();
    userId = data?.user?.id || userId;
  }
  const record = saveTokenLocally({
    token,
    userId,
    username: profile.username || profile.display_name || 'usuario',
    deviceLabel
  });
  const supabaseResult = await saveTokenToSupabase(record);
  return { token, record, supabase: supabaseResult };
}

export async function registerForegroundPushListener(onReceive) {
  const status = getFirebasePushConfigStatus();
  if (!status.ready || Notification.permission !== 'granted') return () => {};
  const { messaging, onMessage } = await loadFirebaseMessaging();
  return onMessage(messaging, payload => {
    const title = payload?.notification?.title || payload?.data?.title || 'MiZona';
    const body = payload?.notification?.body || payload?.data?.body || 'Tienes un nuevo aviso.';
    mutateLocalState(draft => {
      draft.notifications.unshift({
        id: uid('not-fcm'),
        user_id: getActiveLocalProfile().id,
        type: payload?.data?.type || 'chat',
        title,
        body,
        page: payload?.data?.page || 'chat',
        read: false,
        created_at: nowIso()
      });
    }, 'fcm-foreground-notification');
    onReceive?.(payload);
  });
}

export async function sendChatPushTrigger({ conversationId, messageId, title, body }) {
  if (!hasSupabase || !supabase) return { sent: false, reason: 'Supabase no configurado' };
  const { data, error } = await supabase.functions.invoke('send-chat-push', {
    body: { conversationId, messageId, title, body }
  });
  if (error) throw error;
  return data || { sent: true };
}
