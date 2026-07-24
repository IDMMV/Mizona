import { useMemo, useState } from 'react';
import { Bell, LogOut, Menu, Search, Wifi, X, Camera } from 'lucide-react';
import { sectionOrder } from '../data/modules';
import { useApp } from '../context/AppContext';
import { APP_VERSION } from '../version.js';

export default function Shell({ page, setPage, children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { moduleConfig, profile, isAdmin, backendConnected, authLoading, unreadNotifications, online, signOut } = useApp();
  const visibleModules = useMemo(() => (Array.isArray(moduleConfig) ? moduleConfig : []).filter(module => !module.adminOnly || isAdmin), [moduleConfig, isAdmin]);
  const groupedModules = useMemo(() => sectionOrder.map(section => ({ section, items: visibleModules.filter(item => item.section === section) })).filter(group => group.items.length), [visibleModules]);
  const mobileIds = ['panel', 'explore', 'help', 'communities'];
  const mobileModules = mobileIds.map(id => visibleModules.find(item => item.id === id)).filter(Boolean);

  return <div className={`app page-${page} theme-blue mode-light ${open ? 'menuOpen' : ''} ${collapsed ? 'sidebarCollapsed' : ''}`}>
    {open && <button className="sidebarBackdrop" aria-label="Cerrar menú" onClick={() => setOpen(false)}/>} 
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><div className="logo">MZ</div><div><b>MiZona</b><span>Estudiantes · v{APP_VERSION}</span></div><button className="iconBtn mobileOnly" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <div className="sidebarMode"><Wifi size={15}/><span><b>{backendConnected ? 'Supabase activo' : 'Conecta tu cuenta'}</b><small>{online ? 'Internet disponible' : 'Sin conexión'}</small></span></div>
      <nav>{groupedModules.map(group => <div className="navSection" key={group.section}><div className="navSectionLabel">{group.section}</div>{group.items.map(module => { const Icon = module.icon; const badge = module.id === 'notifications' ? unreadNotifications : 0; return <button key={module.id} onClick={() => { setPage(module.id); setOpen(false); }} className={`navItem ${page === module.id ? 'active' : ''}`}><Icon size={18}/><span>{module.label}</span>{badge > 0 && <i className="navBadge">{badge}</i>}</button>; })}</div>)}</nav>
      <div className="phaseBox"><b>MiZona Estudiantes</b><span>Supabase como fuente única</span><div className="bar"><i style={{ width: '55%' }}/></div></div>
      <button className="sidebarLogoutFinal" onClick={() => void signOut()}><LogOut size={18}/><span>Cerrar sesión</span></button>
    </aside>
    <div className="mobileBottomNav">{mobileModules.map(module => { const Icon = module.icon; return <button key={module.id} className={page === module.id ? 'active' : ''} onClick={() => setPage(module.id)}><Icon size={19}/><span>{module.label}</span></button>; })}<button onClick={() => setOpen(true)}><Menu size={19}/><span>Más</span></button></div>
    <main>
      <header className="topbar">
        <button className="iconBtn sidebarMasterToggle" onClick={() => window.matchMedia?.('(max-width: 980px)').matches ? setOpen(true) : setCollapsed(value => !value)}><Menu size={20}/></button>
        <div className="searchBox"><Search size={18}/><input placeholder="Buscar estudiantes, habilidades, instituciones..." onKeyDown={event => { if (event.key === 'Enter') setPage('explore'); }}/></div>
        <span className={`runtimeBadge ${backendConnected ? 'cloud' : 'offline'}`}><Wifi size={15}/> {backendConnected ? 'Nube' : 'Sin sesión'}</span>
        <button className="iconBtn" onClick={() => setPage('notifications')}><Bell size={18}/>{unreadNotifications > 0 && <em>{unreadNotifications}</em>}</button>
        <button className="profileBtn profileBtnPhoto38" onClick={() => setPage('settings')}><span className="topProfileAvatar38">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="perfil"/> : <Camera size={15}/>}</span><span>{authLoading ? 'Verificando...' : profile?.displayName || 'Mi cuenta'}</span></button>
      </header>
      <section className="content">{children}</section>
    </main>
  </div>;
}
