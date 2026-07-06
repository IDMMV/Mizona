import { useMemo, useState } from 'react';
import { Bell, BellRing, CheckCheck, ChevronRight, MessageCircle, School, ShieldAlert, Sparkles, Trash2, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const typeMeta = {
  chat: { label: 'Chat', icon: MessageCircle },
  community: { label: 'Comunidad', icon: School },
  moderation: { label: 'Moderación', icon: ShieldAlert },
  benefit: { label: 'Beneficios', icon: Sparkles },
  system: { label: 'Sistema', icon: WifiOff }
};

const formatDate = value => new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Notifications({ setPage }) {
  const { notifications, unreadNotifications, markNotification, markAllNotificationsRead, deleteNotification, dataMode, online, syncQueueCount } = useApp();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => notifications.filter(item => {
    if (filter === 'unread') return !item.read;
    if (filter === 'all') return true;
    return item.type === filter;
  }), [notifications, filter]);

  const open = item => {
    markNotification(item.id, true);
    if (item.page) setPage(item.page);
  };

  return <div className="page notificationsPage">
    <div className="notificationHero">
      <div><span>ETAPA 14 · AVISOS POR PERFIL</span><h1>Notificaciones</h1><p>Avisos separados por cada perfil local, disponibles incluso sin Supabase.</p></div>
      <div className="notificationHeroStats">
        <span><b>{unreadNotifications}</b> sin leer</span>
        <span><b>{syncQueueCount}</b> acciones locales</span>
        <span><b>{online ? 'En línea' : 'Sin internet'}</b> conexión</span>
      </div>
    </div>

    <div className="localModeStrip">
      <WifiOff size={18}/><div><b>{dataMode === 'local' ? 'Modo local protegido' : 'Modo nube solicitado'}</b><span>Los avisos se guardan en este navegador. No dependen del panel de Supabase.</span></div>
      <button onClick={markAllNotificationsRead}><CheckCheck size={17}/> Marcar todas</button>
    </div>

    <div className="notificationFilters">
      {[['all','Todas'],['unread','No leídas'],['chat','Chat'],['community','Comunidad'],['moderation','Moderación'],['system','Sistema']].map(([id,label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}
    </div>

    <div className="notificationList">
      {filtered.length ? filtered.map(item => {
        const meta = typeMeta[item.type] || typeMeta.system;
        const Icon = meta.icon;
        return <article key={item.id} className={item.read ? 'read' : 'unread'}>
          <button className="notificationMain" onClick={() => open(item)}>
            <span className={`notificationIcon ${item.type}`}><Icon size={21}/></span>
            <span className="notificationText"><small>{meta.label} · {formatDate(item.created_at)}</small><b>{item.title}</b><em>{item.body}</em></span>
            {!item.read && <i className="unreadDot"/>}<ChevronRight size={18}/>
          </button>
          <button className="notificationDelete" title="Eliminar aviso" onClick={() => deleteNotification(item.id)}><Trash2 size={16}/></button>
        </article>;
      }) : <div className="notificationEmpty"><Bell size={48}/><h2>No hay avisos en este filtro</h2><p>Cuando ocurra algo importante aparecerá aquí.</p></div>}
    </div>
  </div>;
}
