import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modules } from '../data/modules';
import { friendlyAuthError, hasSupabase, normalizeUsername, supabase } from '../lib/supabase';

const AppContext = createContext(null);
const MODULE_STORAGE_KEY = 'mizona-v8-module-config';
const PROFILE_STORAGE_KEY = 'mizona-v8-profile';
const TERMS_VERSION = '2026-07';

const demoProfile = {
  id: null,
  displayName: 'José',
  username: 'JOSE1985',
  zone: 'Ventanilla - Pachacútec',
  role: 'super_admin',
  accountType: 'adult',
  avatarUrl: null
};

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

function mapProfile(row, user) {
  if (!row) {
    return {
      ...demoProfile,
      id: user?.id || null,
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
  const [profile, setProfileState] = useState(readStoredProfile);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasSupabase);
  const [backendMessage, setBackendMessage] = useState('');

  const loadProfile = useCallback(async user => {
    if (!supabase || !user?.id) return;
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
  }, []);

  const loadModules = useCallback(async () => {
    if (!supabase) return;
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
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setBackendMessage(friendlyAuthError(error));
      const nextSession = data?.session || null;
      setSession(nextSession);
      if (nextSession?.user) loadProfile(nextSession.user);
      setAuthLoading(false);
    });

    loadModules();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      if (nextSession?.user) {
        window.setTimeout(() => loadProfile(nextSession.user), 0);
      } else {
        setProfileState(readStoredProfile());
      }
    });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadModules, loadProfile]);

  useEffect(() => {
    localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(moduleConfig.map(({ id, status, audience, phase, sortOrder, visible }) => ({ id, status, audience, phase, sortOrder, visible }))));
  }, [moduleConfig]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const signUp = useCallback(async ({ email, password, username, displayName, accountType, zone, termsAccepted }) => {
    if (!supabase) throw new Error('Supabase todavía no está configurado.');
    if (!termsAccepted) throw new Error('Debes aceptar los términos, privacidad y reglas de seguridad.');

    const normalized = normalizeUsername(username);
    if (!/^[a-z0-9_]{4,20}$/.test(normalized)) {
      throw new Error('El usuario debe tener entre 4 y 20 caracteres: letras, números o guion bajo.');
    }

    const { data: available, error: availabilityError } = await supabase.rpc('is_username_available', { p_username: normalized });
    if (availabilityError) throw availabilityError;
    if (!available) throw new Error('Ese nombre de usuario no está disponible.');

    const { data, error } = await supabase.auth.signUp({
      email: String(email || '').trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: normalized,
          display_name: String(displayName || '').trim(),
          account_type: accountType || 'adult',
          zone: String(zone || '').trim(),
          terms_accepted: true,
          terms_version: TERMS_VERSION
        }
      }
    });

    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async ({ identifier, password }) => {
    if (!supabase) throw new Error('Supabase todavía no está configurado.');
    const cleanIdentifier = String(identifier || '').trim();

    if (cleanIdentifier.includes('@')) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanIdentifier.toLowerCase(),
        password
      });
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase.functions.invoke('login-by-username', {
      body: { identifier: normalizeUsername(cleanIdentifier), password }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.access_token || !data?.refresh_token) throw new Error('El acceso por usuario todavía no está desplegado en Supabase Functions. También puedes ingresar con tu correo.');

    const result = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token
    });
    if (result.error) throw result.error;
    return result.data;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async email => {
    if (!supabase) throw new Error('Supabase todavía no está configurado.');
    const { error } = await supabase.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), {
      redirectTo: window.location.origin
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async password => {
    if (!supabase) throw new Error('Supabase todavía no está configurado.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const saveProfile = useCallback(async values => {
    const nextLocal = {
      ...profile,
      displayName: String(values.displayName || '').trim(),
      username: String(values.username || '').trim().toUpperCase(),
      zone: String(values.zone || '').trim()
    };

    if (!supabase || !session?.user?.id) {
      setProfileState(nextLocal);
      return { persisted: false, profile: nextLocal };
    }

    const normalized = normalizeUsername(values.username);
    if (!/^[a-z0-9_]{4,20}$/.test(normalized)) throw new Error('El usuario debe tener entre 4 y 20 caracteres válidos.');

    if (normalized !== String(profile.username || '').toLowerCase()) {
      const { data: available, error: availabilityError } = await supabase.rpc('is_username_available', { p_username: normalized });
      if (availabilityError) throw availabilityError;
      if (!available) throw new Error('Ese nombre de usuario no está disponible.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: nextLocal.displayName,
        username: normalized,
        zone: nextLocal.zone,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select('id,username,display_name,role,account_type,zone,avatar_url,status')
      .single();

    if (error) throw error;
    const mapped = mapProfile(data, session.user);
    setProfileState(mapped);
    return { persisted: true, profile: mapped };
  }, [profile, session]);

  const updateModuleStatus = useCallback(async (id, status) => {
    setModuleConfig(current => current.map(module => module.id === id ? { ...module, status } : module));
    if (!supabase || !session?.user || !['admin', 'super_admin'].includes(profile.role)) return { persisted: false };

    const { error } = await supabase.from('app_modules').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return { persisted: true };
  }, [profile.role, session]);

  const resetModules = useCallback(async () => {
    setModuleConfig(modules);
    if (supabase) await loadModules();
  }, [loadModules]);

  const isAuthenticated = Boolean(session?.user);
  const isAdmin = !hasSupabase || ['admin', 'super_admin'].includes(profile.role);

  const value = useMemo(() => ({
    moduleConfig,
    updateModuleStatus,
    resetModules,
    profile,
    session,
    user: session?.user || null,
    isAuthenticated,
    isAdmin,
    authLoading,
    backendConnected: hasSupabase,
    backendMessage,
    clearBackendMessage: () => setBackendMessage(''),
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    saveProfile,
    refreshProfile: () => session?.user && loadProfile(session.user),
    refreshModules: loadModules
  }), [moduleConfig, profile, session, isAuthenticated, isAdmin, authLoading, backendMessage, signUp, signIn, signOut, resetPassword, updatePassword, saveProfile, loadProfile, loadModules, updateModuleStatus, resetModules]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp debe ejecutarse dentro de AppProvider');
  return value;
}
