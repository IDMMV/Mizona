import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modules } from '../data/modules';
import { hasSupabase, normalizeUsername, supabase } from '../lib/supabase';
import {
  createLocalProfile,
  deleteLocalNotification,
  findLocalProfileExact,
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
const MODULES_KEY = 'mizona-module-config';
const MODE_KEY = 'mizona-data-mode';
const UI_COLOR_KEY = 'mizona-ui-color';
const UI_MODE_KEY = 'mizona-ui-mode';

const safeArray = value => Array.isArray(value) ? value : [];

function normalizeProfile(row) {
  const source = row || {};
  return {
    id: source.id || source.user_id || 'local-guest',
    userId: source.user_id || source.id || null,
    username: source.username || 'INVITADO',
    displayName: source.display_name || source.displayName || source.username || 'Invitado',
    display_name: source.display_name || source.displayName || source.username || 'Invitado',
    avatarUrl: source.avatar_url || source.avatarUrl || null,
    avatar_url: source.avatar_url || source.avatarUrl || null,
    accountType: source.account_type || source.accountType || 'adult',
    account_type: source.account_type || source.accountType || 'adult',
    role: source.role || 'user',
    zone: source.zone || 'Sin zona definida',
    schoolId: source.school_id || source.schoolId || null,
    schoolRole: source.school_role || source.schoolRole || null,
    status: source.status || 'active'
  };
}

function loadModules() {
  try {
    const saved = JSON.parse(localStorage.getItem(MODULES_KEY) || 'null');
    if (!Array.isArray(saved)) return modules;
    return modules.map(base => ({ ...base, ...(saved.find(item => item?.id === base.id) || {}) }));
  } catch {
    return modules;
  }
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [uiColor, setUiColorState] = useState(() => localStorage.getItem(UI_COLOR_KEY) || 'blue');
  const [uiMode, setUiModeState] = useState(() => localStorage.getItem(UI_MODE_KEY) || 'light');
  const [dataMode, setDataModeState] = useState(() => localStorage.getItem(MODE_KEY) || 'local');
  const [moduleConfig, setModuleConfig] = useState(loadModules);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => normalizeProfile(getActiveLocalProfile()));
  const [notifications, setNotifications] = useState(() => safeArray(listLocalNotifications()));
  const [localProfiles, setLocalProfiles] = useState(() => safeArray(listLocalProfiles()));
  const [syncQueueCount, setSyncQueueCount] = useState(() => safeArray(listLocalSyncQueue()).length);
  const [authLoading, setAuthLoading] = useState(Boolean(hasSupabase));
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendMessage, setBackendMessage] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);

  const refreshLocalIndicators = useCallback(() => {
    setProfile(normalizeProfile(getActiveLocalProfile()));
    setNotifications(safeArray(listLocalNotifications()));
    setLocalProfiles(safeArray(listLocalProfiles()));
    setSyncQueueCount(safeArray(listLocalSyncQueue()).length);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!hasSupabase || !supabase || dataMode !== 'cloud') {
      refreshLocalIndicators();
      return normalizeProfile(getActiveLocalProfile());
    }
    const { data: authData } = await supabase.auth.getUser();
    const cloudUser = authData?.user || null;
    setUser(cloudUser);
    if (!cloudUser) {
      setBackendConnected(false);
      return null;
    }
    const { data, error } = await supabase.from('mz_user_profiles').select('*').eq('user_id', cloudUser.id).maybeSingle();
    if (error) throw error;
    const next = normalizeProfile(data || { id: cloudUser.id, user_id: cloudUser.id, username: cloudUser.email?.split('@')[0], display_name: cloudUser.email });
    setProfile(next);
    setBackendConnected(true);
    return next;
  }, [dataMode, refreshLocalIndicators]);

  const refreshModules = useCallback(() => setModuleConfig(loadModules()), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark' || uiMode === 'dark');
    document.documentElement.dataset.theme = uiColor;
  }, [theme, uiMode, uiColor]);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    const unsubscribe = subscribeLocalData(refreshLocalIndicators);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      unsubscribe?.();
    };
  }, [refreshLocalIndicators]);

  useEffect(() => {
    let active = true;
    if (!hasSupabase || !supabase || dataMode !== 'cloud') {
      setBackendConnected(false);
      setAuthLoading(false);
      refreshLocalIndicators();
      return undefined;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setUser(data?.session?.user || null);
      try { await refreshProfile(); } catch (error) { setBackendMessage(error.message); }
      if (active) setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      void refreshProfile().finally(() => setAuthLoading(false));
    });
    return () => {
      active = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [dataMode, refreshLocalIndicators, refreshProfile]);

  const setDataMode = useCallback(mode => {
    const next = mode === 'cloud' ? 'cloud' : 'local';
    localStorage.setItem(MODE_KEY, next);
    setDataModeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const setUiColor = useCallback(value => {
    localStorage.setItem(UI_COLOR_KEY, value);
    setUiColorState(value);
  }, []);

  const setUiMode = useCallback(value => {
    localStorage.setItem(UI_MODE_KEY, value);
    setUiModeState(value);
  }, []);

  const updateModuleStatus = useCallback((id, status) => {
    setModuleConfig(current => {
      const next = safeArray(current).map(item => item.id === id ? { ...item, status } : item);
      localStorage.setItem(MODULES_KEY, JSON.stringify(next.map(({ icon, ...item }) => item)));
      return next;
    });
  }, []);

  const resetModules = useCallback(() => {
    localStorage.removeItem(MODULES_KEY);
    setModuleConfig(modules);
  }, []);

  const activateLocalProfile = useCallback(profileId => {
    switchLocalProfile(profileId);
    refreshLocalIndicators();
  }, [refreshLocalIndicators]);

  const addLocalProfile = useCallback(values => {
    const created = createLocalProfile(values);
    refreshLocalIndicators();
    return created;
  }, [refreshLocalIndicators]);

  const removeLocalProfile = useCallback(profileId => {
    const result = deleteLocalProfile(profileId);
    refreshLocalIndicators();
    return result;
  }, [refreshLocalIndicators]);

  const signIn = useCallback(async ({ identifier, password }) => {
    if (dataMode === 'cloud' && hasSupabase && supabase) {
      const email = String(identifier || '').includes('@') ? identifier : `${normalizeUsername(identifier)}@mizona.local`;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      await refreshProfile();
      return data;
    }
    const row = findLocalProfileExact(identifier);
    if (!row) throw new Error('No existe un usuario local con esos datos.');
    verifyLocalProfilePassword(row.username, password);
    switchLocalProfile(row.id);
    refreshLocalIndicators();
    return { local: true, user: row };
  }, [dataMode, refreshLocalIndicators, refreshProfile]);

  const signUp = useCallback(async values => {
    if (dataMode === 'cloud' && hasSupabase && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { display_name: values.displayName, username: normalizeUsername(values.username) } }
      });
      if (error) throw error;
      return data;
    }
    const created = createLocalProfile(values);
    refreshLocalIndicators();
    return { local: true, user: created };
  }, [dataMode, refreshLocalIndicators]);

  const signOut = useCallback(async () => {
    if (dataMode === 'cloud' && hasSupabase && supabase) await supabase.auth.signOut();
    setUser(null);
    setBackendConnected(false);
    refreshLocalIndicators();
  }, [dataMode, refreshLocalIndicators]);

  const resetPassword = useCallback(async email => {
    if (!hasSupabase || !supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async password => {
    if (!hasSupabase || !supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const saveProfile = useCallback(async values => {
    if (dataMode === 'cloud' && hasSupabase && supabase && user) {
      const { error } = await supabase.from('mz_user_profiles').upsert({
        user_id: user.id,
        display_name: values.displayName,
        username: normalizeUsername(values.username),
        zone: values.zone,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      await refreshProfile();
      return { persisted: true };
    }
    updateActiveLocalProfile(values);
    refreshLocalIndicators();
    return { persisted: false };
  }, [dataMode, refreshLocalIndicators, refreshProfile, user]);

  const markNotification = useCallback((id, read = true) => {
    markLocalNotification(id, read);
    refreshLocalIndicators();
  }, [refreshLocalIndicators]);

  const markAllNotificationsRead = useCallback(() => {
    markAllLocalNotificationsRead();
    refreshLocalIndicators();
  }, [refreshLocalIndicators]);

  const deleteNotification = useCallback(id => {
    deleteLocalNotification(id);
    refreshLocalIndicators();
  }, [refreshLocalIndicators]);

  const clearBackendMessage = useCallback(() => setBackendMessage(''), []);
  const isAuthenticated = dataMode === 'local' ? Boolean(profile?.id && profile.id !== 'local-guest') : Boolean(user);
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role);
  const unreadNotifications = safeArray(notifications).filter(item => !item.read && !item.read_at).length;

  const value = useMemo(() => ({
    theme, toggleTheme, user, setUser,
    profile, isAuthenticated, isAdmin, authLoading,
    backendConfigured: hasSupabase, backendConnected, backendMessage, clearBackendMessage,
    dataMode, setDataMode, online, syncQueueCount,
    moduleConfig: safeArray(moduleConfig), updateModuleStatus, resetModules, refreshModules,
    notifications: safeArray(notifications), unreadNotifications,
    markNotification, markAllNotificationsRead, deleteNotification,
    localProfiles: safeArray(localProfiles), activateLocalProfile, addLocalProfile, removeLocalProfile,
    refreshLocalIndicators, refreshProfile,
    signIn, signUp, signOut, resetPassword, updatePassword, saveProfile,
    uiColor, uiMode, setUiColor, setUiMode
  }), [
    theme, toggleTheme, user, profile, isAuthenticated, isAdmin, authLoading,
    backendConnected, backendMessage, clearBackendMessage, dataMode, setDataMode, online,
    syncQueueCount, moduleConfig, updateModuleStatus, resetModules, refreshModules,
    notifications, unreadNotifications, markNotification, markAllNotificationsRead,
    deleteNotification, localProfiles, activateLocalProfile, addLocalProfile, removeLocalProfile,
    refreshLocalIndicators, refreshProfile, signIn, signUp, signOut, resetPassword,
    updatePassword, saveProfile, uiColor, uiMode, setUiColor, setUiMode
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe utilizarse dentro de AppProvider.');
  return context;
}
