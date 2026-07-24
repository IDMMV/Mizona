import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modules } from '../data/modules';
import { hasSupabase, normalizeUsername, supabase } from '../lib/supabase';

const AppContext = createContext(null);
const safeArray = value => Array.isArray(value) ? value : [];

function normalizeProfile(row, user = null) {
  const source = row || {};
  return {
    id: source.user_id || user?.id || null,
    userId: source.user_id || user?.id || null,
    username: source.username || user?.user_metadata?.username || user?.email?.split('@')[0] || '',
    displayName: source.display_name || user?.user_metadata?.display_name || user?.email || 'Estudiante',
    display_name: source.display_name || user?.user_metadata?.display_name || user?.email || 'Estudiante',
    avatarUrl: source.avatar_url || null,
    avatar_url: source.avatar_url || null,
    role: source.role || 'student',
    educationLevel: source.education_level || 'university',
    verificationStatus: source.verification_status || 'pending',
    zone: source.city || source.zone || '',
    bio: source.bio || '',
    status: source.status || 'active'
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => normalizeProfile(null));
  const [notifications, setNotifications] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [backendMessage, setBackendMessage] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [theme, setTheme] = useState('light');
  const [uiColor, setUiColor] = useState('blue');

  const refreshProfile = useCallback(async activeUser => {
    if (!supabase) return null;
    const currentUser = activeUser || (await supabase.auth.getUser()).data.user;
    if (!currentUser) { setProfile(normalizeProfile(null)); return null; }
    const { data, error } = await supabase.from('mz_user_profiles').select('*').eq('user_id', currentUser.id).maybeSingle();
    if (error) {
      setBackendMessage(error.message);
      const fallback = normalizeProfile(null, currentUser);
      setProfile(fallback);
      return fallback;
    }
    const next = normalizeProfile(data, currentUser);
    setProfile(next);
    return next;
  }, []);

  const refreshNotifications = useCallback(async activeUser => {
    if (!supabase) return [];
    const currentUser = activeUser || (await supabase.auth.getUser()).data.user;
    if (!currentUser) { setNotifications([]); return []; }
    const { data, error } = await supabase.from('mz_notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    setNotifications(safeArray(data));
    return safeArray(data);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = uiColor;
  }, [theme, uiColor]);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => { window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline); };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!hasSupabase || !supabase) { setBackendMessage('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'); setAuthLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const activeUser = data.session?.user || null;
      setUser(activeUser);
      if (activeUser) await Promise.all([refreshProfile(activeUser), refreshNotifications(activeUser)]).catch(error => setBackendMessage(error.message));
      setAuthLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      if (activeUser) await Promise.all([refreshProfile(activeUser), refreshNotifications(activeUser)]).catch(error => setBackendMessage(error.message));
      else { setProfile(normalizeProfile(null)); setNotifications([]); }
      setAuthLoading(false);
    });
    return () => { mounted = false; authListener.subscription.unsubscribe(); };
  }, [refreshNotifications, refreshProfile]);

  useEffect(() => {
    if (!supabase || !user) return;
    const channel = supabase.channel(`notifications:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_notifications', filter: `user_id=eq.${user.id}` }, () => void refreshNotifications(user))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refreshNotifications, user]);

  const signIn = useCallback(async ({ identifier, password }) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const email = String(identifier || '').trim();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async values => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { display_name: values.displayName, username: normalizeUsername(values.username), education_level: values.educationLevel || 'university' } }
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    // Limpiar la interfaz inmediatamente, incluso si la llamada remota falla.
    setUser(null);
    setProfile(normalizeProfile(null));
    setNotifications([]);
    setBackendMessage('');
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      // La sesión visual ya quedó cerrada; conservar el error solo como diagnóstico.
      console.warn('No se pudo cerrar la sesión remota:', error.message);
    }
  }, []);
  const resetPassword = useCallback(async email => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/#settings` });
    if (error) throw error;
  }, []);
  const updatePassword = useCallback(async password => { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; }, []);
  const saveProfile = useCallback(async values => {
    if (!user) throw new Error('Inicia sesión.');
    const payload = { user_id: user.id, display_name: values.displayName, username: normalizeUsername(values.username), city: values.zone || null, bio: values.bio || null, education_level: values.educationLevel || profile.educationLevel, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('mz_user_profiles').upsert(payload);
    if (error) throw error;
    await refreshProfile(user);
    return { persisted: true };
  }, [profile.educationLevel, refreshProfile, user]);

  const markNotification = useCallback(async (id, read = true) => {
    const { error } = await supabase.from('mz_notifications').update({ read_at: read ? new Date().toISOString() : null }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await refreshNotifications(user);
  }, [refreshNotifications, user]);
  const markAllNotificationsRead = useCallback(async () => {
    const { error } = await supabase.from('mz_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    if (error) throw error;
    await refreshNotifications(user);
  }, [refreshNotifications, user]);
  const deleteNotification = useCallback(async id => {
    const { error } = await supabase.from('mz_notifications').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await refreshNotifications(user);
  }, [refreshNotifications, user]);

  const toggleTheme = useCallback(() => setTheme(value => value === 'dark' ? 'light' : 'dark'), []);
  const value = useMemo(() => ({
    theme, toggleTheme, uiColor, uiMode: theme, setUiColor, setUiMode: setTheme,
    user, setUser, profile, isAuthenticated: Boolean(user), isAdmin: ['admin', 'super_admin', 'moderator'].includes(profile.role), authLoading,
    backendConfigured: hasSupabase, backendConnected: Boolean(hasSupabase && user), backendMessage, clearBackendMessage: () => setBackendMessage(''),
    dataMode: 'cloud', setDataMode: () => {}, online, syncQueueCount: 0,
    moduleConfig: modules, updateModuleStatus: () => {}, resetModules: () => {}, refreshModules: () => {},
    notifications, unreadNotifications: notifications.filter(item => !item.read_at).length,
    markNotification, markAllNotificationsRead, deleteNotification,
    localProfiles: [], activateLocalProfile: () => {}, addLocalProfile: () => {}, removeLocalProfile: () => {}, refreshLocalIndicators: () => {},
    refreshProfile, refreshNotifications, signIn, signUp, signOut, resetPassword, updatePassword, saveProfile
  }), [theme, uiColor, user, profile, authLoading, backendMessage, online, notifications, markNotification, markAllNotificationsRead, deleteNotification, refreshProfile, refreshNotifications, signIn, signUp, signOut, resetPassword, updatePassword, saveProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('useApp debe utilizarse dentro de AppProvider.'); return context; }
