import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import { modules, notices, chatThreads } from '../data/modules';

export default function Panel({ setPage }) {
  return <div className="page">
    <section className="hero">
      <div><p className="eyebrow">Resolver • Conectar • Ahorrar • Crecer</p><h1>Hola José, ¿qué necesitas hoy?</h1><p>Comunidad, chat seguro, oportunidades y aprendizaje reunidos en un mismo lugar.</p></div>
      <div className="heroStats"><span>🏫 {notices.length} comunicados</span><span>💬 {chatThreads.length} conversaciones</span><span>🎁 12 ofertas nuevas</span><span>💼 5 empleos cerca</span><span>🎓 2 cursos en progreso</span></div>
    </section>
    <div className="quickGrid">
      <button className="quick" onClick={()=>setPage('community')}>🏫 Ver comunidad</button>
      <button className="quick" onClick={()=>setPage('chat')}>💬 Abrir chat</button>
      <button className="quick" onClick={()=>setPage('transfer')}>📤 Subir tarea</button>
      <button className="quick" onClick={()=>setPage('benefits')}>🎁 Ver oportunidades</button>
      <button className="quick" onClick={()=>setPage('businesses')}>🏪 Explorar negocios</button>
      <button className="quick" onClick={()=>setPage('marketplace')}>🛒 Abrir Marketplace</button>
      <button className="quick" onClick={()=>setPage('campus')}>🎓 Ir a CampusHugo</button>
      <button className="quick" onClick={()=>setPage('admin')}>🛡 Centro de Control</button>
    </div>
    <div className="grid2">
      <Card title="Radar de hoy" icon="📍"><ul className="list">{notices.map(n=><li key={n.title}><b>{n.category}:</b> {n.title} · {n.date}</li>)}</ul></Card>
      <Card title="Módulos preparados" icon="⚙️"><div className="moduleMini">{modules.slice(0,9).map(m=><div key={m.id}><b>{m.label}</b><span>{m.phase}</span><StatusPill status={m.status}/></div>)}</div></Card>
    </div>
  </div>;
}
