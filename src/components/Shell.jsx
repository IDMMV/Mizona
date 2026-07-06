import { useState } from 'react';
import { Bell, Menu, Search, User, X } from 'lucide-react';
import { statusLabel } from '../data/modules';
import { useApp } from '../context/AppContext';

export default function Shell({ page, setPage, children }) {
  const [open, setOpen] = useState(false);
  const { moduleConfig, profile } = useApp();
  return <div className="app">
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="logo">MZ</div><div><b>MiZona</b><span>Enterprise V8</span></div>
        <button className="iconBtn mobileOnly" onClick={() => setOpen(false)}><X size={18}/></button>
      </div>
      <nav>
        {moduleConfig.map(m => { const Icon = m.icon; return <button key={m.id} onClick={() => { setPage(m.id); setOpen(false); }} className={`navItem ${page === m.id ? 'active' : ''}`}>
          <Icon size={18}/><span>{m.label}</span>{m.status !== 'active' && <small>{statusLabel[m.status]}</small>}
        </button>; })}
      </nav>
      <div className="phaseBox"><b>Sprint actual</b><span>Versión final V8</span><div className="bar"><i style={{width:'100%'}} /></div></div>
    </aside>
    <main>
      <header className="topbar">
        <button className="iconBtn mobileOnly" onClick={() => setOpen(true)}><Menu size={20}/></button>
        <div className="searchBox"><Search size={18}/><input placeholder="¿Qué necesitas hoy? colegio, chat, ofertas, servicios..." /></div>
        <button className="zoneBtn">📍 {profile.zone}</button>
        <button className="iconBtn"><Bell size={18}/><em>3</em></button>
        <button className="profileBtn" onClick={() => setPage('settings')}><User size={18}/> {profile.displayName}</button>
      </header>
      <section className="content">{children}</section>
    </main>
  </div>;
}
