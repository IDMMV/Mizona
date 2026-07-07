import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import { notices, chatThreads } from '../data/modules';
import { useApp } from '../context/AppContext';
import { canAccessModule, isStudentProfile, profileAudienceLabel } from '../lib/permissions';

export default function Panel({ setPage }) {
  const { moduleConfig, profile } = useApp();
  const student = isStudentProfile(profile);
  const quicks = [
    ['community','🏫 Ver comunidad'], ['chat','💬 Abrir chat'], ['transfer','📤 Subir tarea'], ['campus','🎓 Ir a CampusHugo'],
    ['committees','📋 Plataforma comités'], ['benefits','🎁 Ver oportunidades'], ['businesses','🏪 Explorar negocios'], ['marketplace','🛒 Abrir Marketplace'],
    ['business','🧾 Administrar negocio'], ['ride','🚗 Pedir viaje o envío'], ['ai','✨ Consultar IA MiZona'], ['sync','☁️ Usuarios y sync'], ['cloudCenter','🔔 Nube y Push'], ['quality','🧪 Calidad y piloto'], ['localLab','🧪 Laboratorio local'], ['admin','🛡 Centro de Control']
  ].filter(([id]) => canAccessModule(profile, id));
  const visibleModuleRows = moduleConfig.filter(m => canAccessModule(profile, m.id));
  return <div className="page">
    <section className="hero">
      <div><p className="eyebrow">{profileAudienceLabel(profile)}</p><h1>Hola {profile.displayName}, ¿qué necesitas hoy?</h1><p>{student ? 'Modo estudiante: solo comunidad escolar, chat seguro, tareas, archivos y aprendizaje.' : 'Comunidad, comités, chat seguro, oportunidades y servicios reunidos en un mismo lugar.'}</p></div>
      <div className="heroStats">{student ? <><span>🏫 {notices.length} comunicados escolares</span><span>💬 {chatThreads.length} chats permitidos</span><span>📤 Archivos de tareas</span><span>🎓 2 cursos en progreso</span></> : <><span>🏫 {notices.length} comunicados</span><span>📋 Comités y gastos</span><span>💬 {chatThreads.length} conversaciones</span><span>🎁 12 ofertas nuevas</span><span>💼 5 empleos cerca</span><span>🎓 2 cursos en progreso</span><span>🧾 S/ 1,284 en ventas</span><span>🚗 24 conductores cerca</span></>}</div>
    </section>
    <div className="quickGrid">
      {quicks.map(([id,label]) => <button key={id} className="quick" onClick={()=>setPage(id)}>{label}</button>)}
    </div>
    <div className="grid2">
      <Card title="Radar de hoy" icon="📍"><ul className="list">{notices.map(n=><li key={n.title}><b>{n.category}:</b> {n.title} · {n.date}</li>)}</ul></Card>
      <Card title="Módulos preparados" icon="⚙️"><div className="moduleMini">{visibleModuleRows.slice(0,12).map(m=><div key={m.id}><b>{m.label}</b><span>{m.phase}</span><StatusPill status={m.status}/></div>)}</div></Card>
    </div>
  </div>;
}
