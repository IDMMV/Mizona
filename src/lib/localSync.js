import { readLocalState, listLocalProfiles, listLocalSyncQueue, exportLocalBackup, importLocalBackup, mutateLocalState } from './localStore';
import { hasSupabase } from './supabase';

const KEY = 'mizona-v8-sync-readiness-v24';
const CHANNEL = 'mizona-v8-sync-readiness-v24-channel';
const now = () => new Date().toISOString();
const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const defaults = {
  version: 24,
  mode: 'local_first',
  updated_at: now(),
  settings: {
    targetBackend: 'Supabase',
    allowCloudLogin: false,
    allowUsernameLogin: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    migrationMode: 'manual_review',
    conflictPolicy: 'keep_newest',
    keepLocalBackupBeforeSync: true,
    syncChatRetentionDays: 7,
    protectMinors: true,
    adultModulesRequireAdultAccount: true,
    syncPaymentsOnlyVerified: true
  },
  devices: [
    { id: 'DEV-LOCAL-1', name: 'Este navegador', type: 'PC / Navegador', status: 'active', lastSeen: now(), trusted: true },
    { id: 'DEV-DEMO-2', name: 'Celular de prueba', type: 'Android', status: 'pending', lastSeen: null, trusted: false }
  ],
  cloudPlan: {
    profiles: 'pending',
    modules: 'pending',
    community: 'pending',
    chat: 'pending',
    files: 'pending',
    payments: 'blocked_until_legal',
    verification: 'pending'
  },
  testResults: [],
  migrationRuns: [],
  audit: []
};

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return saved?.version === 24 ? { ...clone(defaults), ...saved, settings: { ...defaults.settings, ...(saved.settings || {}) } } : clone(defaults);
  } catch {
    return clone(defaults);
  }
}

function write(state, action = 'sync_updated') {
  const next = { ...state, version: 24, updated_at: now(), audit: [{ id: id('audit'), action, at: now() }, ...(state.audit || [])].slice(0, 100) };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANNEL, { detail: next }));
  try { const bc = new BroadcastChannel(CHANNEL); bc.postMessage(next); bc.close(); } catch {}
  return next;
}

export function getSyncState() {
  return read();
}

export function subscribeSync(callback) {
  const handler = () => callback(read());
  window.addEventListener(CHANNEL, handler);
  window.addEventListener('storage', handler);
  let bc;
  try { bc = new BroadcastChannel(CHANNEL); bc.onmessage = handler; } catch {}
  return () => {
    window.removeEventListener(CHANNEL, handler);
    window.removeEventListener('storage', handler);
    bc?.close();
  };
}

export function updateSyncSettings(patch) {
  const state = read();
  state.settings = { ...state.settings, ...patch };
  return write(state, 'settings_updated');
}

export function trustDevice(deviceId, trusted = true) {
  const state = read();
  state.devices = state.devices.map(device => device.id === deviceId ? { ...device, trusted, status: trusted ? 'active' : 'pending', lastSeen: trusted ? now() : device.lastSeen } : device);
  return write(state, trusted ? 'device_trusted' : 'device_untrusted');
}

export function addPendingDevice({ name, type }) {
  const state = read();
  const device = { id: `DEV-${Date.now().toString().slice(-6)}`, name: name || 'Nuevo dispositivo', type: type || 'Navegador', status: 'pending', lastSeen: null, trusted: false, pairingCode: generatePairingCode() };
  state.devices = [device, ...state.devices];
  write(state, 'device_pending_created');
  return device;
}

export function generatePairingCode() {
  return `MZ-${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function buildMigrationPreview() {
  const local = readLocalState();
  const profiles = listLocalProfiles();
  const queue = listLocalSyncQueue();
  const messageCount = Object.values(local.messages || {}).reduce((total, rows) => total + rows.length, 0);
  const fileCount = Object.values(local.messages || {}).flat().reduce((total, message) => total + (message.attachments || []).length, 0);
  return {
    generatedAt: now(),
    backendConfigured: hasSupabase,
    summary: {
      profiles: profiles.length,
      students: profiles.filter(p => p.account_type === 'student' || p.accountType === 'student').length,
      admins: profiles.filter(p => ['admin', 'super_admin'].includes(p.role)).length,
      conversations: local.conversations?.length || 0,
      messages: messageCount,
      attachments: fileCount,
      reports: local.reports?.length || 0,
      notifications: local.notifications?.length || 0,
      syncQueue: queue.length,
      auditLogs: local.auditLogs?.length || 0
    },
    profiles: profiles.map(profile => ({ id: profile.id, username: profile.username, displayName: profile.display_name || profile.displayName, accountType: profile.account_type || profile.accountType, role: profile.role, zone: profile.zone, status: profile.status })),
    warnings: [
      ...(!hasSupabase ? ['No hay variables de Supabase configuradas.'] : []),
      ...(profiles.some(p => p.account_type === 'student' || p.accountType === 'student') ? ['Existen cuentas estudiantiles: deben migrarse con reglas de menor de edad y módulos restringidos.'] : []),
      ...(fileCount ? ['Hay archivos locales: se requiere almacenamiento en nube antes de migrarlos.'] : []),
      ...(queue.length ? ['Hay acciones locales pendientes: revisar antes de sincronizar.'] : [])
    ]
  };
}

export function runReadinessChecks() {
  const state = read();
  const preview = buildMigrationPreview();
  const checks = [
    { id: 'supabase', label: 'Backend configurado', status: hasSupabase ? 'ok' : 'warning', detail: hasSupabase ? 'Variables Supabase detectadas.' : 'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o el backend no está activo.' },
    { id: 'backup', label: 'Respaldo antes de sincronizar', status: state.settings.keepLocalBackupBeforeSync ? 'ok' : 'warning', detail: 'Se recomienda descargar respaldo antes de subir datos.' },
    { id: 'minors', label: 'Protección de menores', status: state.settings.protectMinors ? 'ok' : 'fail', detail: state.settings.protectMinors ? 'Las cuentas estudiantiles se mantienen restringidas.' : 'No se debe desactivar protección de menores.' },
    { id: 'profiles', label: 'Usuarios locales', status: preview.summary.profiles > 0 ? 'ok' : 'fail', detail: `${preview.summary.profiles} perfiles listos para revisión.` },
    { id: 'verified-payments', label: 'Pagos y verificación', status: state.settings.syncPaymentsOnlyVerified ? 'ok' : 'warning', detail: 'Los pagos protegidos deben limitarse a vendedores verificados.' },
    { id: 'files', label: 'Archivos y retención', status: preview.summary.attachments === 0 ? 'ok' : 'warning', detail: `${preview.summary.attachments} adjuntos locales requieren almacenamiento real.` }
  ];
  const next = read();
  next.testResults = checks.map(check => ({ ...check, at: now() }));
  return write(next, 'readiness_checks_run');
}

export function createMigrationRun() {
  const preview = buildMigrationPreview();
  const state = read();
  const run = {
    id: `MIG-${Date.now().toString().slice(-8)}`,
    createdAt: now(),
    status: hasSupabase ? 'ready_for_manual_execution' : 'blocked_no_backend',
    summary: preview.summary,
    warnings: preview.warnings,
    steps: [
      'Descargar respaldo local completo.',
      'Crear o validar usuarios reales en backend.',
      'Migrar perfiles y roles.',
      'Migrar comunidades, comités y negocios.',
      'Migrar chats respetando retención de 7 días.',
      'Subir archivos a almacenamiento real.',
      'Validar pagos, verificaciones y permisos.',
      'Activar sincronización por etapas.'
    ]
  };
  state.migrationRuns = [run, ...(state.migrationRuns || [])].slice(0, 20);
  write(state, 'migration_run_created');
  return run;
}

export function markCloudPlan(key, status) {
  const state = read();
  state.cloudPlan = { ...state.cloudPlan, [key]: status };
  return write(state, `cloud_plan_${key}_${status}`);
}

export function downloadMigrationPreview() {
  const payload = { ...buildMigrationPreview(), syncSettings: read() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mizona-etapa24-plan-migracion-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

export { exportLocalBackup, importLocalBackup };
