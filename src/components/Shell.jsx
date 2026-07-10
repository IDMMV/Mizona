import { useMemo, useState } from 'react';
import { Bell, CloudOff, LogOut, Menu, Search, User, Wifi, X, Camera } from 'lucide-react';
import { statusLabel } from '../data/modules';
import { useApp } from '../context/AppContext';
import { canAccessModule } from '../lib/permissions';

export default function Shell({ page, setPage, children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mizona-sidebar-collapsed') === '1');
  const { moduleConfig, profile, isAdmin, isAuthenticated, backendConnected, authLoading, unreadNotifications, dataMode, online, syncQueueCount, signOut, uiColor, uiMode } = useApp();

  const canLogout = isAuthenticated || (profile?.id && profile.id !== 'local-guest') || profile?.username === 'JOSE1985';

  const visibleModules = useMemo(() => moduleConfig.filter(module => {
    if (module.visible === false) return false;
    return canAccessModule(profile, module.id);
  }), [moduleConfig, profile]);

  const mobilePrimaryModules = useMemo(() => ['panel', 'committees', 'chat', 'business', 'more']
    .map(id => id === 'more'
      ? { id: 'more', label: 'Más', icon: Menu, target: 'menu' }
      : visibleModules.find(module => module.id === id))
    .filter(Boolean), [visibleModules]);

  const toggleSidebar = () => {
    if (window.matchMedia?.('(max-width: 980px)')?.matches) return setOpen(true);
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('mizona-sidebar-collapsed', next ? '1' : '0');
  };

  return <div className={`app theme-${uiColor || 'green'} mode-${uiMode || 'light'} ${open ? 'menuOpen' : ''} ${collapsed ? 'sidebarCollapsed' : ''}`}>
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
          return <button key={module.id} onClick={() => { setPage(module.id); setOpen(false); }} className={`navItem nav-${module.id} ${page === module.id ? 'active' : ''}`}>
            <Icon size={18}/><span>{module.label}</span>{badge ? <i className="navBadge">{badge}</i> : module.status !== 'active' && <small>{statusLabel[module.status]}</small>}
          </button>;
        })}
      </nav>
      <div className="phaseBox"><b>Etapa actual</b><span>Etapa 30 · Finanzas personales privadas</span><div className="bar"><i style={{ width: '100%' }}/></div></div>
      <button className="sidebarLogoutFinal" onClick={() => { void signOut().finally(() => { setPage('settings'); setOpen(false); }); }} aria-label="Cerrar sesión" title="Cerrar sesión">
        <LogOut size={18}/><span>Cerrar sesión</span>
      </button>
    </aside>
    <div className="mobileBottomNav" aria-label="Navegación principal móvil">
      {mobilePrimaryModules.map(module => {
        const Icon = module.icon;
        const active = module.id !== 'more' && page === module.id;
        return <button key={module.id} className={active ? 'active' : ''} onClick={() => module.target === 'menu' ? setOpen(true) : setPage(module.id)}>
          <Icon size={19}/><span>{module.id === 'panel' ? 'Inicio' : module.id === 'committees' ? 'Comités' : module.id === 'chat' ? 'Chat' : module.id === 'business' ? 'Business' : module.label}</span>
        </button>;
      })}
    </div>
    <main>
      <header className="topbar">
        <button className="iconBtn sidebarMasterToggle" onClick={toggleSidebar} title={collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}><Menu size={20}/></button>
        <div className="searchBox"><Search size={18}/><input placeholder="¿Qué necesitas hoy? colegio, chat, ofertas, servicios..."/></div>
        <span className={`runtimeBadge ${backendConnected ? 'cloud' : 'local'} ${online ? '' : 'offline'}`}>{online ? <Wifi size={15}/> : <CloudOff size={15}/>} {backendConnected ? 'Nube' : dataMode === 'local' ? 'Local' : 'Contingencia'}</span>
        <button className="zoneBtn">📍 {profile.zone}</button>
        <button className="iconBtn" onClick={() => setPage('notifications')} aria-label="Abrir notificaciones"><Bell size={18}/>{unreadNotifications > 0 && <em>{unreadNotifications > 99 ? '99+' : unreadNotifications}</em>}</button>
        <button className="profileBtn profileBtnPhoto38" onClick={() => setPage('settings')}>
          <span className="topProfileAvatar38">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="perfil"/> : <Camera size={15}/>}</span>
          <span>{authLoading ? 'Verificando...' : profile.displayName}</span>
          <span className={`sessionDot ${dataMode === 'local' || backendConnected ? 'online' : ''}`} title={dataMode === 'local' ? 'Perfil local activo' : backendConnected ? 'Sesión conectada' : 'Sin conexión'}/>
        </button>
      </header>
      <section className="content">{children}</section>
    </main>
  </div>;
}
