import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { modules } from '../data/modules';

const AppContext = createContext(null);
const STORAGE_KEY = 'mizona-v8-module-config';

function readStoredModules() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!Array.isArray(saved)) return modules;
    return modules.map(module => ({ ...module, ...(saved.find(item => item.id === module.id) || {}) }));
  } catch {
    return modules;
  }
}

export function AppProvider({ children }) {
  const [moduleConfig, setModuleConfig] = useState(readStoredModules);
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mizona-v8-profile') || 'null') || { displayName: 'José', username: 'JOSE1985', zone: 'Ventanilla - Pachacútec' }; }
    catch { return { displayName: 'José', username: 'JOSE1985', zone: 'Ventanilla - Pachacútec' }; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(moduleConfig.map(({ id, status, audience, phase }) => ({ id, status, audience, phase })))); }, [moduleConfig]);
  useEffect(() => { localStorage.setItem('mizona-v8-profile', JSON.stringify(profile)); }, [profile]);

  const updateModuleStatus = (id, status) => setModuleConfig(current => current.map(module => module.id === id ? { ...module, status } : module));
  const resetModules = () => setModuleConfig(modules);
  const value = useMemo(() => ({ moduleConfig, updateModuleStatus, resetModules, profile, setProfile }), [moduleConfig, profile]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp debe ejecutarse dentro de AppProvider');
  return value;
}
