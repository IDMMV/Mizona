import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Bell, User, Menu, X, LogOut } from 'lucide-react';
import { modules } from './data/modules';
import './styles/app.css';

const statusLabel = {
  activo: 'Activo',
  beta: 'Beta',
  mantenimiento: 'Mantenimiento',
  desactivado: 'Próximamente'
};

function StatusPill({ status }) {
  return <span className={`pill ${status}`}>{statusLabel[status]}</span>;
}

function Sidebar({ page, setPage, open, setOpen }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="logo">MZ</div>
        <div>
          <strong>MiZona</strong>
          <span>Enterprise V8</span>
        </div>
        <button className="iconBtn mobileOnly" onClick={() => setOpen(false)}><X size={18}/></button>
      </div>
      <nav>
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => { setPage(m.path); setOpen(false); }} className={`navItem ${page === m.path ? 'active' : ''}`}>
              <Icon size={18}/>
              <span>{m.label}</span>
              {m.status !== 'activo' && <small>{statusLabel[m.status]}</small>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar({ setOpen, setPage }) {
  return (
    <header className="topbar">
      <button className="iconBtn mobileOnly" onClick={() => setOpen(true)}><Menu size={20}/></button>
      <div className="searchBox">
        <Search size={18}/>
        <input placeholder="¿Qué necesitas hoy en tu zona?" />
      </div>
      <button className="iconBtn"><Bell size={19}/></button>
      <button className="profileBtn" onClick={() => setPage('perfil')}><User size={18}/> José</button>
    </header>
  );
}

function Card({ title, children, icon, action }) {
  return <section className="card"><div className="cardHead"><h3>{icon} {title}</h3>{action}</div>{children}</section>;
}

function Panel() {
  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Resolver • Conectar • Ahorrar • Crecer</p>
          <h1>Hola José, ¿qué necesitas hoy?</h1>
          <p>MiZona prioriza colegios, comunidades, chat seguro y oportunidades cercanas.</p>
        </div>
        <div className="heroStats">
          <span>🏫 3 comunicados</span><span>💬 7 chats</span><span>🎁 12 beneficios</span>
        </div>
      </section>
      <div className="quickGrid">
        {['🏫 Colegio', '💬 Chat', '📤 Transfer', '🎁 Beneficios', '🏪 Negocios', '🛡 Admin'].map(x => <button className="quick" key={x}>{x}</button>)}
      </div>
      <div className="grid2">
        <Card title="Radar de hoy" icon="📍"><ul className="list"><li>Nuevo comunicado escolar pendiente.</li><li>Aula Chat elimina archivos en 7 días.</li><li>MiZona Transfer listo para tareas pesadas.</li></ul></Card>
        <Card title="Módulos activos" icon="⚙️"><div className="moduleMini">{modules.slice(0,6).map(m => <div key={m.id}><span>{m.label}</span><StatusPill status={m.status}/></div>)}</div></Card>
      </div>
    </div>
  );
}

function Comunidad() {
  return <div className="page"><h1>Mi Comunidad</h1><p className="muted">Motor inicial para colegios, comités, clubes, urbanizaciones y asociaciones.</p><div className="grid3">{['🏫 Colegios','🏘 Comités','⚽ Clubes','🏢 Empresas','⛪ Iglesias','🤝 Asociaciones'].map(t=><Card key={t} title={t}><p>Crear, administrar, comunicar, invitar miembros y controlar permisos.</p><button className="primary">Abrir</button></Card>)}</div></div>;
}

function Chat() {
  return <div className="page"><h1>MiZona Chat</h1><p className="muted">Identidad con usuario único, invitaciones y chat seguro.</p><div className="grid2"><Card title="Buscar por usuario exacto" icon="🔎"><input className="field" placeholder="Ej. JOSE1985"/><button className="primary">Enviar invitación</button></Card><Card title="Reglas escolares" icon="🛡"><ul className="list"><li>Sin chat entre colegios por ahora.</li><li>Aula Chat solo dentro del colegio/salón.</li><li>Chats y archivos escolares duran 7 días.</li></ul></Card></div></div>;
}

function Transfer() {
  return <div className="page"><h1>MiZona Transfer</h1><p className="muted">Carga temporal de archivos para tareas y trabajos escolares.</p><Card title="Subir archivo temporal" icon="📤"><div className="drop">Arrastra archivos aquí o selecciona desde tu dispositivo<br/><small>PDF, Word, Excel, PowerPoint, imágenes. Vencimiento: 7 días.</small></div><button className="primary">Seleccionar archivo</button></Card></div>;
}

function Beneficios() { return <Placeholder title="Beneficios" desc="Promociones, cupones, eventos, campañas y oportunidades."/>; }
function Negocios() { return <Placeholder title="Negocios y Lugares" desc="Directorio, reclamo de negocio, verificación y campañas medibles."/>; }
function Placeholder({ title, desc }) { return <div className="page"><h1>{title}</h1><p className="muted">{desc}</p><div className="soon">🚧 Módulo preparado para la siguiente integración funcional.</div></div>; }

function Admin() {
  const [localModules, setLocalModules] = useState(modules);
  const counts = useMemo(() => localModules.reduce((a,m)=>({...a,[m.status]:(a[m.status]||0)+1}),{}),[localModules]);
  const cycle = (status) => status === 'activo' ? 'beta' : status === 'beta' ? 'mantenimiento' : status === 'mantenimiento' ? 'desactivado' : 'activo';
  return <div className="page"><h1>Centro de Control Enterprise</h1><p className="muted">El administrador controla la evolución completa de MiZona.</p><div className="stats"><span>🟢 Activos: {counts.activo||0}</span><span>🟡 Beta: {counts.beta||0}</span><span>🔴 Mant.: {counts.mantenimiento||0}</span><span>⚪ Próx.: {counts.desactivado||0}</span></div><Card title="Control de módulos" icon="🛡"><div className="adminTable">{localModules.map((m,i)=><div key={m.id}><strong>{m.label}</strong><span>{m.audience}</span><StatusPill status={m.status}/><button onClick={()=>setLocalModules(arr=>arr.map((x,idx)=>idx===i?{...x,status:cycle(x.status)}:x))}>Cambiar estado</button></div>)}</div></Card></div>;
}

function AuthPage({ type }) {
  const label = type === 'login' ? 'Iniciar sesión' : type === 'registro' ? 'Crear cuenta' : 'Recuperar acceso';
  return <div className="auth"><div className="authCard"><div className="logo big">MZ</div><h1>{label}</h1><input className="field" placeholder="Usuario único"/><input className="field" placeholder="Correo"/><input className="field" placeholder="Contraseña" type="password"/><label className="check"><input type="checkbox"/> Acepto términos, privacidad y reglas de seguridad.</label><button className="primary full">Continuar</button></div></div>;
}

function Perfil() { return <div className="page"><h1>Mi Cuenta</h1><Card title="Identidad MiZona" icon="👤"><p><b>@JOSE1985</b></p><p className="muted">Usuario único para chat, comunidad, beneficios y módulos futuros.</p><button className="primary">Editar perfil</button></Card></div>; }

function App() {
  const [page, setPage] = useState('panel');
  const [open, setOpen] = useState(false);
  const authPages = ['login','registro','recuperar'];
  if (authPages.includes(page)) return <AuthPage type={page}/>;
  const Page = { panel: Panel, comunidad: Comunidad, chat: Chat, transfer: Transfer, beneficios: Beneficios, negocios: Negocios, marketplace: ()=><Placeholder title="Marketplace" desc="Compra, venta y alquiler local."/>, campus: ()=><Placeholder title="CampusHugo" desc="Cursos, evaluaciones y certificados."/>, business: ()=><Placeholder title="MiZona Business" desc="Ventas, caja, inventario, reportes y campañas."/>, ride: ()=><Placeholder title="MiZona Ride" desc="Pasajeros, conductores, delivery y envíos."/>, ia: ()=><Placeholder title="IA MiZona" desc="Asistente para resolver necesidades."/>, admin: Admin, perfil: Perfil }[page] || Panel;
  return <div className="app"><Sidebar page={page} setPage={setPage} open={open} setOpen={setOpen}/><main><Topbar setOpen={setOpen} setPage={setPage}/><div className="content"><Page/></div></main></div>;
}

createRoot(document.getElementById('root')).render(<App />);
