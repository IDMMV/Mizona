import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import { notices, chatThreads } from '../data/modules';
import { useApp } from '../context/AppContext';

export default function Panel({ setPage }) {
  const { moduleConfig, profile } = useApp();
  return <div className="page">
    <section className="hero">
      <div><p className="eyebrow">Resolver • Conectar • Ahorrar • Crecer</p><h1>Hola {profile.displayName}, ¿qué necesitas hoy?</h1><p>Comunidad, chat seguro, oportunidades y aprendizaje reunidos en un mismo lugar.</p></div>
      <div className="heroStats"><span>🏫 {notices.length} comunicados</span><span>💬 {chatThreads.length} conversaciones</span><span>🎁 12 ofertas nuevas</span><span>💼 5 empleos cerca</span><span>🎓 2 cursos en progreso</span><span>🧾 S/ 1,284 en ventas</span><span>🚗 24 conductores cerca</span><span>✨ IA disponible</span></div>
    </section>
    <div className="quickGrid">
      <button className="quick" onClick={()=>setPage('community')}>🏫 Ver comunidad</button>
      <button className="quick" onClick={()=>setPage('chat')}>💬 Abrir chat</button>
      <button className="quick" onClick={()=>setPage('transfer')}>📤 Subir tarea</button>
      <button className="quick" onClick={()=>setPage('benefits')}>🎁 Ver oportunidades</button>
      <button className="quick" onClick={()=>setPage('businesses')}>🏪 Explorar negocios</button>
      <button className="quick" onClick={()=>setPage('marketplace')}>🛒 Abrir Marketplace</button>
      <button className="quick" onClick={()=>setPage('campus')}>🎓 Ir a CampusHugo</button>
      <button className="quick" onClick={()=>setPage('business')}>🧾 Administrar negocio</button>
      <button className="quick" onClick={()=>setPage('ride')}>🚗 Pedir viaje o envío</button>
      <button className="quick" onClick={()=>setPage('ai')}>✨ Consultar IA MiZona</button>
      <button className="quick" onClick={()=>setPage('localLab')}>🧪 Laboratorio local</button>
      <button className="quick" onClick={()=>setPage('admin')}>🛡 Centro de Control</button>
    </div>
    <div className="grid2">
      <Card title="Radar de hoy" icon="📍"><ul className="list">{notices.map(n=><li key={n.title}><b>{n.category}:</b> {n.title} · {n.date}</li>)}</ul></Card>
      <Card title="Módulos preparados" icon="⚙️"><div className="moduleMini">{moduleConfig.slice(0,12).map(m=><div key={m.id}><b>{m.label}</b><span>{m.phase}</span><StatusPill status={m.status}/></div>)}</div></Card>
    </div>
  </div>;
}
