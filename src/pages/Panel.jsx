import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import { notices, chatThreads, modules } from '../data/modules';
import { useApp } from '../context/AppContext';
import { canAccessModule, isStudentProfile, profileAudienceLabel } from '../lib/permissions';
import { MessageCircle, ClipboardList, Bell, Radar, Zap, CalendarDays, FileUp, MapPin, CloudUpload } from 'lucide-react';

const money = value => `S/ ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const modulesById = Object.fromEntries(modules.map(m => [m.id, m]));

export default function Panel({ setPage }) {
  const { moduleConfig, profile, unreadNotifications, backendConnected, online, syncQueueCount } = useApp();
  const student = isStudentProfile(profile);

  const visibleModules = moduleConfig.filter(m => canAccessModule(profile, m.id));
  const quicks = [
    ['chat', 'Abrir chat', 'Mensajes y soporte'],
    ['committees', 'Revisar comité', 'Cuotas, pagos y comunicados'],
    ['notifications', 'Ver avisos', 'Pendientes y recordatorios'],
    ['business', 'Administrar negocio', 'Caja, cocina y reportes'],
    ['marketplace', 'Marketplace', 'Productos y servicios'],
    ['ride', 'Pedir viaje', 'Movilidad y envíos'],
    ['benefits', 'Beneficios', 'Ofertas y campañas'],
    ['cloudCenter', 'Nube y Push', 'Permisos y notificaciones']
  ].filter(([id]) => canAccessModule(profile, id));

  const metrics = student
    ? [
        ['Comunicados', notices.length, 'Escolares'],
        ['Chats permitidos', chatThreads.length, 'Seguros'],
        ['Tareas', 2, 'Pendientes'],
        ['Cursos', 2, 'En progreso']
      ]
    : [
        ['Comunicados', notices.length, 'Nuevos hoy'],
        ['Conversaciones', chatThreads.length, 'No leídas'],
        ['Pagos pendientes', 8, 'Por revisar'],
        ['Ventas', money(1284), 'Acumulado'],
        ['Empleos cerca', 5, 'Disponibles'],
        ['Conductores', 24, 'Cerca']
      ];

  const radar = [
    ...notices.map(n => ({ Icon: n.category === 'Evento' ? CalendarDays : n.category === 'Tarea' ? FileUp : MapPin, title: n.title, meta: `${n.category} · ${n.date}`, page: n.category === 'Evento' ? 'committees' : 'notifications' })),
    { Icon: MessageCircle, title: `${chatThreads.length} conversaciones`, meta: 'Chat seguro y grupos locales', page: 'chat' },
    { Icon: CloudUpload, title: backendConnected ? 'Supabase conectado' : 'Acciones locales guardadas', meta: backendConnected ? 'Sincronización activa' : `${syncQueueCount} acciones en este navegador`, page: 'cloudCenter' }
  ];

  return <div className="page panelSmartPage">
    <section className="smartHero">
      <div>
        <p className="eyebrow">{profileAudienceLabel(profile)}</p>
        <h1>Hola {profile.displayName}, revisa lo importante de hoy</h1>
        <p>{student ? 'Accede rápido a comunicados, chat seguro, tareas y aprendizaje.' : 'Tu panel resume comunidad, comités, negocios, chat, pagos, beneficios y movilidad en una sola vista.'}</p>
        <div className="smartHeroActions">
          <button onClick={() => setPage('chat')}><MessageCircle size={16}/> Abrir chat</button>
          <button onClick={() => setPage('committees')}><ClipboardList size={16}/> Comité</button>
          <button onClick={() => setPage('business')}><FileUp size={16}/> Business</button>
        </div>
      </div>
      <div className="smartMetricGrid">
        {metrics.map(([label, value, hint]) => <span key={label}><b>{value}</b><small>{label}</small><em>{hint}</em></span>)}
      </div>
    </section>

    <section className="smartOverview">
      <Card title="Radar de hoy" icon={<Radar size={18}/>}>
        <div className="radarList">
          {radar.map((item, index) => <button key={`${item.title}-${index}`} onClick={() => setPage(item.page)}>
            <i><item.Icon size={17}/></i><span><b>{item.title}</b><small>{item.meta}</small></span><em>Ver</em>
          </button>)}
        </div>
      </Card>
      <Card title="Acciones rápidas" icon={<Zap size={18}/>}>
        <div className="quickActionGrid">
          {quicks.map(([id, label, hint]) => {
            const ModIcon = modulesById[id]?.icon || Bell;
            return <button key={id} onClick={() => setPage(id)}><i><ModIcon size={19}/></i><b>{label}</b><small>{hint}</small></button>;
          })}
        </div>
      </Card>
    </section>

    <section className="smartModules">
      <div className="sectionHeader"><div><h2>Módulos activos</h2><p className="muted">Estado general de las áreas preparadas para MiZona.</p></div><button onClick={() => setPage('admin')}>Centro de Control</button></div>
      <div className="moduleStatusGrid">
        {visibleModules.slice(0, 12).map(module => <article key={module.id} onClick={() => setPage(module.id)}>
          <b>{module.label}</b><span>{module.phase}</span><StatusPill status={module.status}/>
        </article>)}
      </div>
    </section>
  </div>;
}
