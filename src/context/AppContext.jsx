import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modules } from '../data/modules';
import { friendlyAuthError, hasSupabase, normalizeUsername, supabase } from '../lib/supabase';
import { loadCloudNotifications, markAllCloudNotificationsRead, markCloudNotification, subscribeCloudNotifications } from '../lib/cloudBackend';
import {
  cleanupExpiredLocalData,
  createLocalProfile,
  deleteLocalNotification,
  deleteLocalProfile,
  getActiveLocalProfile,
  listLocalNotifications,
  listLocalProfiles,
  listLocalSyncQueue,
  markAllLocalNotificationsRead,
  markLocalNotification,
  subscribeLocalData,
  switchLocalProfile,
  updateActiveLocalProfile,
  verifyLocalProfilePassword
} from '../lib/localStore';

const AppContext = createContext(null);
const MODULE_STORAGE_KEY = 'mizona-v8-module-config';
const PROFILE_STORAGE_KEY = 'mizona-v8-profile';
const DATA_MODE_KEY = 'mizona-v8-data-mode-v13';
const TERMS_VERSION = '2026-07';

const demoProfile = {
  id: 'local-user-jose',
  displayName: 'José',
  username: 'JOSE1985',
  zone: 'Ventanilla - Pachacútec',
  role: 'super_admin',
  accountType: 'adult',
  avatarUrl: null,
  status: 'active'
};

const LOCAL_SIGNED_OUT_KEY = 'mizona-v8-local-signed-out';

const guestProfile = {
  id: 'local-guest',
  displayName: 'Visitante',
  username: 'VISITANTE',
  zone: 'Sin zona definida',
  role: 'guest',
  accountType: 'visitor',
  avatarUrl: null,
  status: 'guest'
};

function isLocalSignedOut() {
  return sessionStorage.getItem(LOCAL_SIGNED_OUT_KEY) === 'true';
}

function setLocalSignedOut(value) {
  if (value) sessionStorage.setItem(LOCAL_SIGNED_OUT_KEY, 'true');
  else sessionStorage.removeItem(LOCAL_SIGNED_OUT_KEY);
}

function readStoredModules() {
  try {
    const saved = JSON.parse(localStorage.getItem(MODULE_STORAGE_KEY) || 'null');
    if (!Array.isArray(saved)) return modules;
    return modules.map(module => ({ ...module, ...(saved.find(item => item.id === module.id) || {}) }));
  } catch {
    return modules;
  }
}

function readStoredProfile() {
  try {
    return { ...demoProfile, ...(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null') || {}) };
  } catch {
    return demoProfile;
  }
}

function readDataMode() {
  const saved = localStorage.getItem(DATA_MODE_KEY);
  return saved === 'cloud' ? 'cloud' : 'local';
}

function mapProfile(row, user) {
  if (!row) {
    return {
      ...demoProfile,
      id: user?.id || demoProfile.id,
      displayName: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuario',
      username: String(user?.user_metadata?.username || 'USUARIO').toUpperCase(),
      role: 'user'
    };
  }

  return {
    id: row.id,
    displayName: row.display_name,
    username: String(row.username || '').toUpperCase(),
    zone: row.zone || 'Sin zona definida',
    role: row.role || 'user',
    accountType: row.account_type || 'adult',
    avatarUrl: row.avatar_url || null,
    status: row.status || 'active'
  };
}

function mergeRemoteModules(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return readStoredModules();
  return modules
    .map(module => {
      const remote = rows.find(item => item.id === module.id);
      return remote
        ? {
            ...module,
            status: remote.status || module.status,
            audience: remote.audience || module.audience,
            phase: remote.phase || module.phase,
            sortOrder: remote.sort_order ?? module.sortOrder ?? 0,
            visible: remote.visible !== false
          }
        : module;
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function AppProvider({ children }) {
  const [moduleConfig, setModuleConfig] = useState(readStoredModules);
  const [profile, setProfileState] = useState(() => readDataMode() === 'local' ? (isLocalSignedOut() ? guestProfile : getActiveLocalProfile()) : readStoredProfile());
  const [localProfiles, setLocalProfiles] = useState(listLocalProfiles);
  const [dataMode, setDataModeState] = useState(readDataMode);
  const [online, setOnline] = useState(() => navigator.onLine);
  const cloudActive = dataMode === 'cloud' && hasSupabase && online;
  const [session, setSession] = useState(() => dataMode === 'local' && !isLocalSignedOut() ? { user: { id: getActiveLocalProfile().id, email: null, local: true } } : null);
  const [authLoading, setAuthLoading] = useState(cloudActive);
  const [backendMessage, setBackendMessage] = useState('');
  const [notifications, setNotifications] = useState(listLocalNotifications);

  const refreshCloudNotifications = useCallback(async userId => {
    if (!cloudActive || !userId) return;
    try { setNotifications(await loadCloudNotifications(userId)); }
    catch (error) { setBackendMessage(`Notificaciones usando respaldo local: ${error.message}`); }
  }, [cloudActive]);
  const [syncQueueCount, setSyncQueueCount] = useState(() => listLocalSyncQueue().length);

  const refreshLocalIndicators = useCallback(() => {
    if (isLocalSignedOut()) {
      setProfileState(guestProfile);
      setSession(null);
      setLocalProfiles(listLocalProfiles());
      setNotifications([]);
      setSyncQueueCount(listLocalSyncQueue().filter(item => item.status === 'local_only').length);
      return;
    }
    const active = getActiveLocalProfile();
    setProfileState(active);
    setSession({ user: { id: active.id, email: null, local: true } });
    setLocalProfiles(listLocalProfiles());
    setNotifications(listLocalNotifications());
    setSyncQueueCount(listLocalSyncQueue().filter(item => item.status === 'local_only').length);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const unsubscribe = subscribeLocalData(refreshLocalIndicators);
    cleanupExpiredLocalData().finally(refreshLocalIndicators);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      unsubscribe();
    };
  }, [refreshLocalIndicators]);

  const loadProfile = useCallback(async user => {
    if (!supabase || !user?.id || !cloudActive) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id,username,display_name,role,account_type,zone,avatar_url,status')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      setBackendMessage(`Perfil pendiente de configuración: ${error.message}`);
      setProfileState(mapProfile(null, user));
      return;
    }

    const next = mapProfile(data, user);
    setProfileState(next);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  }, [cloudActive]);

  const loadModules = useCallback(async () => {
    if (!supabase || !cloudActive) return;
    const { data, error } = await supabase
      .from('app_modules')
      .select('id,status,audience,phase,sort_order,visible')
      .order('sort_order', { ascending: true });

    if (error) {
      setBackendMessage(`Módulos usando respaldo local: ${error.message}`);
      return;
    }

    const next = mergeRemoteModules(data);
    setModuleConfig(next);
    localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(next.map(({ id, status, audience, phase, sortOrder, visible }) => ({ id, status, audience, phase, sortOrder, visible }))));
  }, [cloudActive]);

  useEffect(() => {
    if (!cloudActive || !session?.user?.id) return undefined;
    refreshCloudNotifications(session.user.id);
    return subscribeCloudNotifications(session.user.id, () => refreshCloudNotifications(session.user.id));
  }, [cloudActive, session?.user?.id, refreshCloudNotifications]);

  useEffect(() => {
    if (!cloudActive) {
      if (isLocalSignedOut()) {
        setProfileState(guestProfile);
        setSession(null);
        setNotifications([]);
        setAuthLoading(false);
        setBackendMessage('Sesión local cerrada. Puedes ingresar nuevamente desde Mi Cuenta > Acceso.');
        return undefined;
      }
      const localProfile = getActiveLocalProfile();
      setProfileState(localProfile);
      setSession({ user: { id: localProfile.id, email: null, local: true } });
      setAuthLoading(false);
      setBackendMessage(dataMode === 'local' ? 'Modo local activo: los datos se guardan en este dispositivo.' : 'Supabase no está disponible; MiZona conserva el modo local.');
      return undefined;
    }

    let active = true;
    setAuthLoading(true);
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setBackendMessage(friendlyAuthError(error));
      const nextSession = data?.session || null;
      setSession(nextSession);
      if (nextSession?.user) loadProfile(nextSession.user);
      setAuthLoading(false);
    }).catch(error => {
      if (!active) return;
      setBackendMessage(`No se pudo abrir Supabase: ${friendlyAuthError(error)}. Se recomienda volver al modo local.`);
      setAuthLoading(false);
    });

    loadModules();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      if (nextSession?.user) window.setTimeout(() => loadProfile(nextSession.user), 0);
    });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [cloudActive, dataMode, loadModules, loadProfile]);

  useEffect(() => {
    localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(moduleConfig.map(({ id, status, audience, phase, sortOrder, visible }) => ({ id, status, audience, phase, sortOrder, visible }))));
  }, [moduleConfig]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const setDataMode = useCallback(mode => {
    const next = mode === 'cloud' ? 'cloud' : 'local';
    localStorage.setItem(DATA_MODE_KEY, next);
    setDataModeState(next);
    if (next === 'local') {
      if (isLocalSignedOut()) {
        setProfileState(guestProfile);
        setSession(null);
        setBackendMessage('Modo local activado. Inicia sesión local para usar tu perfil.');
        return;
      }
      const localProfile = getActiveLocalProfile();
      setProfileState(localProfile);
      setSession({ user: { id: localProfile.id, email: null, local: true } });
      setBackendMessage('Modo local activado. No se realizarán llamadas a Supabase.');
    }
  }, []);

  const signUp = useCallback(async ({ email, password, username, displayName, accountType, zone, secretQuestion, secretAnswer, termsAccepted }) => {
    if (!termsAccepted) throw new Error('Debes aceptar los términos, privacidad y reglas de seguridad.');
    const normalized = normalizeUsername(username);
    if (!/^[a-z0-9_]{4,20}$/.test(normalized)) throw new Error('El usuario debe tener entre 4 y 20 caracteres: letras, números o guion bajo.');

    if (!cloudActive) {
      setLocalSignedOut(false);
      const next = createLocalProfile({ displayName, username: normalized, accountType, zone, role: 'user', password, secretQuestion, secretAnswer });
      setProfileState(next);
      setLocalProfiles(listLocalProfiles());
      setSession({ user: { id: next.id, email: String(email || '').trim().toLowerCase(), local: true } });
      setNotifications(listLocalNotifications());
      return { session: { user: { id: next.id, local: true } }, local: true };
    }

    const { data: available, error: availabilityError } = await supabase.rpc('is_username_available', { p_username: normalized });
    if (availabilityError) throw availabilityError;
    if (!available) throw new Error('Ese nombre de usuario no está disponible.');

    const { data, error } = await supabase.auth.signUp({
      email: String(email || '').trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username: normalized, display_name: String(displayName || '').trim(), account_type: accountType || 'adult', zone: String(zone || '').trim(), terms_accepted: true, terms_version: TERMS_VERSION }
      }
    });
    if (error) throw error;
    return data;
  }, [cloudActive]);

  const signIn = useCallback(async ({ identifier, password }) => {
    if (!cloudActive) {
      setLocalSignedOut(false);
      const clean = String(identifier || '').trim().toUpperCase();
      const match = listLocalProfiles().find(item => String(item.username).toUpperCase() === clean);
      if (!match) throw new Error('No existe un perfil local con ese usuario. Créalo en Mi Cuenta > Acceso.');
      verifyLocalProfilePassword(clean, password);
      const next = switchLocalProfile(match.id);
      setProfileState(next);
      setLocalProfiles(listLocalProfiles());
      setSession({ user: { id: next.id, email: null, local: true } });
      setNotifications(listLocalNotifications());
      return { session: { user: { id: next.id, local: true } }, local: true };
    }

    const cleanIdentifier = String(identifier || '').trim();
    if (cleanIdentifier.includes('@')) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanIdentifier.toLowerCase(), password });
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.functions.invoke('login-by-username', { body: { identifier: normalizeUsername(cleanIdentifier), password } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.access_token || !data?.refresh_token) throw new Error('El acceso por usuario todavía no está desplegado. También puedes ingresar con tu correo.');
    const result = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
    if (result.error) throw result.error;
    return result.data;
  }, [cloudActive]);

  const signOut = useCallback(async () => {
    // Cierre visible y efectivo para modo local, modo nube y perfiles cargados desde respaldo.
    if (cloudActive && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setLocalSignedOut(true);
    setSession(null);
    setProfileState(guestProfile);
    setNotifications([]);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    setBackendMessage('Sesión cerrada. Tus datos locales no se borraron.');
    return { local: !cloudActive };
  }, [cloudActive]);

  const resetPassword = useCallback(async email => {
    if (!cloudActive) throw new Error('La recuperación de contraseña requiere Supabase. El perfil local no utiliza una contraseña real.');
    const { error } = await supabase.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), { redirectTo: window.location.origin });
    if (error) throw error;
  }, [cloudActive]);

  const updatePassword = useCallback(async password => {
    if (!cloudActive) throw new Error('El modo local no guarda contraseñas. Activa Supabase para usar autenticación real.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, [cloudActive]);

  const saveProfile = useCallback(async values => {
    const nextLocal = {
      ...profile,
      id: profile.id || demoProfile.id,
      displayName: String(values.displayName || '').trim(),
      username: String(values.username || '').trim().toUpperCase(),
      zone: String(values.zone || '').trim()
    };

    if (!cloudActive || !session?.user?.id) {
      if (!session?.user?.id) throw new Error('Inicia sesión local antes de editar el perfil.');
      const next = updateActiveLocalProfile(values);
      setProfileState(next);
      setLocalProfiles(listLocalProfiles());
      setSession({ user: { id: next.id, email: null, local: true } });
      return { persisted: false, local: true, profile: next };
    }

    const normalized = normalizeUsername(values.username);
    if (!/^[a-z0-9_]{4,20}$/.test(normalized)) throw new Error('El usuario debe tener entre 4 y 20 caracteres válidos.');
    if (normalized !== String(profile.username || '').toLowerCase()) {
      const { data: available, error: availabilityError } = await supabase.rpc('is_username_available', { p_username: normalized });
      if (availabilityError) throw availabilityError;
      if (!available) throw new Error('Ese nombre de usuario no está disponible.');
    }
    const { data, error } = await supabase.from('profiles').update({ display_name: nextLocal.displayName, username: normalized, zone: nextLocal.zone, updated_at: new Date().toISOString() }).eq('id', session.user.id).select('id,username,display_name,role,account_type,zone,avatar_url,status').single();
    if (error) throw error;
    const mapped = mapProfile(data, session.user);
    setProfileState(mapped);
    return { persisted: true, profile: mapped };
  }, [cloudActive, profile, session]);

  const updateModuleStatus = useCallback(async (id, status) => {
    setModuleConfig(current => current.map(module => module.id === id ? { ...module, status } : module));
    if (!cloudActive || !session?.user || !['admin', 'super_admin'].includes(profile.role)) return { persisted: false, local: true };
    const { error } = await supabase.from('app_modules').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return { persisted: true };
  }, [cloudActive, profile.role, session]);

  const resetModules = useCallback(async () => {
    setModuleConfig(modules);
    if (cloudActive) await loadModules();
  }, [cloudActive, loadModules]);

  const activateLocalProfile = useCallback(profileId => {
    setLocalSignedOut(false);
    const next = switchLocalProfile(profileId);
    setProfileState(next);
    setLocalProfiles(listLocalProfiles());
    setSession({ user: { id: next.id, email: null, local: true } });
    setNotifications(listLocalNotifications());
    setBackendMessage(`Perfil local activo: @${next.username}.`);
    return next;
  }, []);

  const addLocalProfile = useCallback(values => {
    setLocalSignedOut(false);
    const next = createLocalProfile(values);
    setProfileState(next);
    setLocalProfiles(listLocalProfiles());
    setSession({ user: { id: next.id, email: null, local: true } });
    setNotifications(listLocalNotifications());
    return next;
  }, []);

  const removeLocalProfile = useCallback(profileId => {
    deleteLocalProfile(profileId);
    setLocalProfiles(listLocalProfiles());
    return true;
  }, []);

  const unreadNotifications = notifications.filter(item => !item.read).length;
  const isAuthenticated = Boolean(session?.user);
  const isAdmin = Boolean(session?.user) && ['admin', 'super_admin'].includes(profile.role);

  const value = useMemo(() => ({
    moduleConfig,
    updateModuleStatus,
    resetModules,
    profile,
    localProfiles,
    activateLocalProfile,
    addLocalProfile,
    removeLocalProfile,
    session,
    user: session?.user || null,
    isAuthenticated,
    isAdmin,
    authLoading,
    backendConnected: cloudActive,
    backendConfigured: hasSupabase,
    backendMessage,
    clearBackendMessage: () => setBackendMessage(''),
    dataMode,
    setDataMode,
    online,
    notifications,
    unreadNotifications,
    syncQueueCount,
    refreshLocalIndicators,
    markNotification: async (id, read = true) => { if (cloudActive) { await markCloudNotification(id, read); await refreshCloudNotifications(session?.user?.id); } else { markLocalNotification(id, read); refreshLocalIndicators(); } },
    markAllNotificationsRead: async () => { if (cloudActive) { await markAllCloudNotificationsRead(session?.user?.id); await refreshCloudNotifications(session?.user?.id); } else { markAllLocalNotificationsRead(); refreshLocalIndicators(); } },
    deleteNotification: id => { if (!cloudActive) { deleteLocalNotification(id); refreshLocalIndicators(); } },
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    saveProfile,
    refreshProfile: () => session?.user && loadProfile(session.user),
    refreshModules: loadModules,
    refreshCloudNotifications
  }), [moduleConfig, profile, localProfiles, activateLocalProfile, addLocalProfile, removeLocalProfile, session, isAuthenticated, isAdmin, authLoading, cloudActive, backendMessage, dataMode, setDataMode, online, notifications, unreadNotifications, syncQueueCount, refreshLocalIndicators, signUp, signIn, signOut, resetPassword, updatePassword, saveProfile, loadProfile, loadModules, refreshCloudNotifications, updateModuleStatus, resetModules]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp debe ejecutarse dentro de AppProvider');
  return value;
}
