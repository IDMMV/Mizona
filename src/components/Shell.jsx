import { useMemo, useState } from 'react';
import { Bell, CloudOff, LogOut, Menu, Search, User, Wifi, X } from 'lucide-react';
import { statusLabel } from '../data/modules';
import { useApp } from '../context/AppContext';
import { canAccessModule } from '../lib/permissions';

export default function Shell({ page, setPage, children }) {
  const [open, setOpen] = useState(false);
  const { moduleConfig, profile, isAdmin, isAuthenticated, backendConnected, authLoading, unreadNotifications, dataMode, online, syncQueueCount, signOut } = useApp();

  const canLogout = isAuthenticated || (profile?.id && profile.id !== 'local-guest') || profile?.username === 'JOSE1985';

  const visibleModules = useMemo(() => moduleConfig.filter(module => {
    if (module.visible === false) return false;
    return canAccessModule(profile, module.id);
  }), [moduleConfig, profile]);

  return <div className={`app ${open ? 'menuOpen' : ''}`}>
    {open && <button className="sidebarBackdrop" aria-label="Cerrar menú" onClick={() => setOpen(false)}/>}
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="logo">MZ</div><div><b>MiZona</b><span>Enterprise V8</span></div>
        <button className="iconBtn mobileOnly" onClick={() => setOpen(false)}><X size={18}/></button>
      </div>
      <div className="sidebarMode">{backendConnected ? <Wifi size={15}/> : <CloudOff size={15}/>}<span><b>{backendConnected ? 'Nube activa' : 'Modo local'}</b><small>{backendConnected ? 'Supabase conectado' : `${syncQueueCount} acciones guardadas`}</small></span></div>
      <nav>
        {visibleModules.map(module => {
          const Icon = module.icon;
          const badge = module.id === 'notifications' && unreadNotifications > 0 ? unreadNotifications : null;
          return <button key={module.id} onClick={() => { setPage(module.id); setOpen(false); }} className={`navItem ${page === module.id ? 'active' : ''}`}>
            <Icon size={18}/><span>{module.label}</span>{badge ? <i className="navBadge">{badge}</i> : module.status !== 'active' && <small>{statusLabel[module.status]}</small>}
          </button>;
        })}
      </nav>
      <div className="phaseBox"><b>Etapa actual</b><span>Etapa 30 · Finanzas personales privadas</span><div className="bar"><i style={{ width: '100%' }}/></div></div>
      <button className="sidebarLogoutBtn" onClick={() => { void signOut().finally(() => { setPage('settings'); setOpen(false); }); }} aria-label="Cerrar sesión" title="Cerrar sesión">
        <LogOut size={18}/><span>Cerrar sesión</span>
      </button>
    </aside>
    <main>
      <header className="topbar">
        <button className="iconBtn mobileOnly" onClick={() => setOpen(true)}><Menu size={20}/></button>
        <div className="searchBox"><Search size={18}/><input placeholder="¿Qué necesitas hoy? colegio, chat, ofertas, servicios..."/></div>
        <span className={`runtimeBadge ${backendConnected ? 'cloud' : 'local'} ${online ? '' : 'offline'}`}>{online ? <Wifi size={15}/> : <CloudOff size={15}/>} {backendConnected ? 'Nube' : dataMode === 'local' ? 'Local' : 'Contingencia'}</span>
        <button className="zoneBtn">📍 {profile.zone}</button>
        <button className="iconBtn" onClick={() => setPage('notifications')} aria-label="Abrir notificaciones"><Bell size={18}/>{unreadNotifications > 0 && <em>{unreadNotifications > 99 ? '99+' : unreadNotifications}</em>}</button>
        {canLogout && <button className="logoutTopTextBtn" onClick={() => { void signOut().finally(() => setPage('settings')); }} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={17}/><span>Cerrar sesión</span></button>}
        <button className="profileBtn" onClick={() => setPage(isAuthenticated ? 'settings' : 'settings')}>
          <User size={18}/>{authLoading ? 'Verificando...' : profile.displayName}
          <span className={`sessionDot ${dataMode === 'local' || backendConnected ? 'online' : ''}`} title={dataMode === 'local' ? 'Perfil local activo' : backendConnected ? 'Sesión conectada' : 'Sin conexión'}/>
        </button>
      </header>
      <section className="content">{children}</section>
    </main>
  </div>;
}
