import { useMemo, useState } from 'react';
import { Bell, Menu, Search, User, X } from 'lucide-react';
import { statusLabel } from '../data/modules';
import { useApp } from '../context/AppContext';

export default function Shell({ page, setPage, children }) {
  const [open, setOpen] = useState(false);
  const { moduleConfig, profile, isAuthenticated, isAdmin, backendConnected, authLoading } = useApp();

  const visibleModules = useMemo(() => moduleConfig.filter(module => {
    if (module.visible === false) return false;
    if (module.id === 'admin' && backendConnected && !isAdmin) return false;
    return true;
  }), [moduleConfig, backendConnected, isAdmin]);

  return <div className="app">
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="logo">MZ</div><div><b>MiZona</b><span>Enterprise V8</span></div>
        <button className="iconBtn mobileOnly" onClick={() => setOpen(false)}><X size={18}/></button>
      </div>
      <nav>
        {visibleModules.map(module => {
          const Icon = module.icon;
          return <button key={module.id} onClick={() => { setPage(module.id); setOpen(false); }} className={`navItem ${page === module.id ? 'active' : ''}`}>
            <Icon size={18}/><span>{module.label}</span>{module.status !== 'active' && <small>{statusLabel[module.status]}</small>}
          </button>;
        })}
      </nav>
      <div className="phaseBox"><b>Etapa actual</b><span>Etapa 12 · chat y contactos reales</span><div className="bar"><i style={{ width: '92%' }}/></div></div>
    </aside>
    <main>
      <header className="topbar">
        <button className="iconBtn mobileOnly" onClick={() => setOpen(true)}><Menu size={20}/></button>
        <div className="searchBox"><Search size={18}/><input placeholder="¿Qué necesitas hoy? colegio, chat, ofertas, servicios..."/></div>
        <button className="zoneBtn">📍 {profile.zone}</button>
        <button className="iconBtn"><Bell size={18}/><em>3</em></button>
        <button className="profileBtn" onClick={() => setPage('settings')}>
          <User size={18}/>{authLoading ? 'Verificando...' : profile.displayName}
          <span className={`sessionDot ${isAuthenticated ? 'online' : ''}`} title={isAuthenticated ? 'Sesión conectada' : 'Sin sesión real'}/>
        </button>
      </header>
      <section className="content">{children}</section>
    </main>
  </div>;
}
