import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BarChart3, Building2, CalendarDays, Camera, Check, ChevronLeft, CircleUserRound, Download, FileText, GraduationCap, Image, LoaderCircle, LockKeyhole, Megaphone, Plus, Puzzle, RefreshCw, Search, ShieldCheck, Upload, UserCheck, UserPlus, Users, X } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import { hasSupabase } from '../lib/supabase';
import {
  createAnnouncement,
  createCommunity,
  createCommunityEvent,
  createDocumentSignedUrl,
  createSchoolRoom,
  leaveCommunity,
  listCommunities,
  listMyMemberships,
  loadCommunityBundle,
  requestCommunityJoin,
  reviewCommunity,
  reviewMembership,
  subscribeCommunity,
  uploadCommunityDocument
} from '../lib/community';
import {
  createLocalAnnouncement,
  createLocalCommunity,
  createLocalEvent,
  createLocalRoom,
  leaveLocalCommunity,
  listLocalCommunities,
  listLocalMemberships,
  loadLocalCommunityBundle,
  openLocalCommunityDocument,
  requestLocalJoin,
  reviewLocalCommunity,
  reviewLocalMembership,
  subscribeLocalCommunity,
  uploadLocalCommunityDocument
} from '../lib/localCommunity';

const TYPE_META = {
  school: { label: 'Colegio', icon: '🏫' },
  committee: { label: 'Comité', icon: '📋' },
  club: { label: 'Club', icon: '⚽' },
  urbanization: { label: 'Urbanización', icon: '🏘️' },
  company: { label: 'Empresa', icon: '🏢' },
  church: { label: 'Iglesia', icon: '⛪' },
  association: { label: 'Asociación', icon: '🤝' },
  neighborhood: { label: 'Barrio', icon: '📍' },
  other: { label: 'Otra', icon: '👥' }
};

const STATUS_LABEL = {
  pending: 'Pendiente', active: 'Activa', rejected: 'Rechazada', suspended: 'Suspendida', archived: 'Archivada',
  left: 'Saliste', blocked: 'Bloqueado'
};

const ROLE_LABEL = {
  owner: 'Propietario', admin: 'Administrador', moderator: 'Moderador', teacher: 'Profesor',
  parent: 'Padre/Madre', student: 'Estudiante', member: 'Miembro'
};

const EMPTY_BUNDLE = { announcements: [], events: [], rooms: [], members: [], documents: [] };

const DEMO_COMMUNITIES = [
  {
    id: 'demo-school', owner_id: 'demo', name: 'Colegio San Martín', slug: 'colegio-san-martin',
    type: 'school', zone: 'Ventanilla', description: 'Comunidad escolar demostrativa con comunicados, aulas y documentos.',
    status: 'active', visibility: 'public', join_mode: 'request', member_count: 248, school_level: 'Primaria y secundaria',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-committee', owner_id: 'demo', name: 'Comité Vecinal Pachacútec', slug: 'comite-pachacutec',
    type: 'committee', zone: 'Pachacútec', description: 'Avisos, reuniones y documentos del comité vecinal.',
    status: 'active', visibility: 'public', join_mode: 'open', member_count: 96,
    created_at: new Date().toISOString()
  }
];

const DEMO_BUNDLE = {
  announcements: [
    { id: 'a1', title: 'Reunión general', body: 'La reunión será el viernes a las 6:00 p. m. en el auditorio.', audience: 'public', is_pinned: true, published_at: new Date().toISOString() },
    { id: 'a2', title: 'Actividad deportiva', body: 'Inscripciones abiertas para la jornada deportiva del sábado.', audience: 'members', is_pinned: false, published_at: new Date().toISOString() }
  ],
  events: [
    { id: 'e1', title: 'Jornada comunitaria', description: 'Limpieza y ordenamiento del parque.', location: 'Parque principal', starts_at: new Date(Date.now() + 86400000 * 2).toISOString(), audience: 'public', status: 'published' }
  ],
  photos: [
    { id:'ph1', title:'Actividad del comité', emoji:'📸', date:new Date().toISOString(), author:'Administrador' },
    { id:'ph2', title:'Reunión general', emoji:'🏫', date:new Date(Date.now()-86400000).toISOString(), author:'Comunidad' },
    { id:'ph3', title:'Entrega de documentos', emoji:'🗂️', date:new Date(Date.now()-86400000*3).toISOString(), author:'Secretaría' }
  ],
  rooms: [
    { id: 'r1', name: '5.º A', grade: 'Quinto', section: 'A', teacher_id: null },
    { id: 'r2', name: '2.º B', grade: 'Segundo', section: 'B', teacher_id: null }
  ],
  members: [
    { user_id: 'demo', role: 'owner', status: 'active', profile: { display_name: 'José Hugo', username: 'JOSE1985', account_type: 'adult' } },
    { user_id: 'demo2', role: 'teacher', status: 'active', profile: { display_name: 'María Torres', username: 'MARIA_T', account_type: 'adult' } }
  ],
  documents: [
    { id: 'd1', title: 'Comunicado de reunión', file_name: 'comunicado.pdf', size_bytes: 245000, created_at: new Date().toISOString() }
  ]
};

const mainTabs = [
  { id: 'discover', label: 'Explorar', icon: '🔎' },
  { id: 'mine', label: 'Mis comunidades', icon: '🏘️' },
  { id: 'requests', label: 'Solicitudes', icon: '🛡️' }
];

const detailTabs = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'announcements', label: 'Comunicados', icon: '📢' },
  { id: 'events', label: 'Eventos', icon: '📅' },
  { id: 'members', label: 'Miembros', icon: '👥' },
  { id: 'rooms', label: 'Aulas', icon: '🏫' },
  { id: 'photos', label: 'Fotos', icon: '📸' },
  { id: 'documents', label: 'Documentos', icon: '📁' }
];

function formatDate(value, withTime = false) {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(Number(bytes))) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = Number(bytes);
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getInitials(name = '') {
  return String(name).split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'MZ';
}

export default function Community({ setPage, autoSelectType = null }) {
  const { user, profile, isAuthenticated, isAdmin, backendConnected } = useApp();
  const [tab, setTab] = useState('discover');
  const [detailTab, setDetailTab] = useState('home');
  const [communities, setCommunities] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [bundle, setBundle] = useState(EMPTY_BUNDLE);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const refreshTimer = useRef(null);

  const selected = useMemo(() => communities.find(item => item.id === selectedId) || null, [communities, selectedId]);
  const selectedMembership = useMemo(() => memberships.find(item => item.community_id === selectedId) || null, [memberships, selectedId]);
  const canManage = Boolean(isAdmin || ['owner', 'admin', 'moderator'].includes(selectedMembership?.role));
  const canPublish = Boolean(canManage || selectedMembership?.role === 'teacher');
  const isActiveMember = selectedMembership?.status === 'active';

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return communities.filter(item => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesText = !needle || [item.name, item.zone, item.description, TYPE_META[item.type]?.label]
        .filter(Boolean).join(' ').toLowerCase().includes(needle);
      return matchesType && matchesText;
    });
  }, [communities, search, typeFilter]);

  const myCommunities = useMemo(() => {
    const ids = new Set(memberships.filter(item => item.status !== 'left').map(item => item.community_id));
    return communities.filter(item => ids.has(item.id) || item.owner_id === user?.id);
  }, [communities, memberships, user?.id]);

  const pendingCommunities = useMemo(() => communities.filter(item => item.status === 'pending'), [communities]);

  const loadBase = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      if (!backendConnected || !hasSupabase) {
        setCommunities(listLocalCommunities());
        setMemberships(listLocalMemberships(user?.id));
        return;
      }
      const [communityRows, membershipRows] = await Promise.all([
        listCommunities(),
        user?.id ? listMyMemberships(user.id) : Promise.resolve([])
      ]);
      setCommunities(communityRows);
      setMemberships(membershipRows);
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar las comunidades.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [backendConnected, user?.id]);

  const loadDetail = useCallback(async (communityId, silent = false) => {
    if (!communityId) return;
    if (!silent) setDetailLoading(true);
    try {
      if (!backendConnected || !hasSupabase) {
        setBundle(loadLocalCommunityBundle(communityId));
        return;
      }
      const membership = memberships.find(item => item.community_id === communityId);
      const includePrivate = Boolean(isAdmin || membership?.status === 'active');
      const next = await loadCommunityBundle(communityId, includePrivate);
      setBundle(next);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cargar la comunidad.');
      setBundle(EMPTY_BUNDLE);
    } finally {
      if (!silent) setDetailLoading(false);
    }
  }, [backendConnected, isAdmin, memberships]);

  useEffect(() => { loadBase(); }, [loadBase]);

  useEffect(() => {
    if (!autoSelectType || loading || selectedId) return;
    const target = communities.find(item => item.type === autoSelectType);
    if (target) setSelectedId(target.id);
  }, [autoSelectType, communities, loading, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setBundle(EMPTY_BUNDLE);
      return undefined;
    }
    loadDetail(selectedId);
    if (!backendConnected || !hasSupabase) {
      return subscribeLocalCommunity(() => {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(() => {
          loadBase(true);
          loadDetail(selectedId, true);
        }, 120);
      });
    }
    return subscribeCommunity(selectedId, () => {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => {
        loadBase(true);
        loadDetail(selectedId, true);
      }, 350);
    });
  }, [selectedId, backendConnected, loadDetail, loadBase]);

  const execute = async (key, action, successMessage) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await action();
      if (successMessage) setMessage(successMessage);
      await loadBase(true);
      if (selectedId) await loadDetail(selectedId, true);
      return true;
    } catch (requestError) {
      setError(requestError.message || 'La operación no pudo completarse.');
      return false;
    } finally {
      setBusy('');
    }
  };

  const openCommunity = item => {
    setSelectedId(item.id);
    setDetailTab('home');
    setError('');
    setMessage('');
  };

  if (selected) {
    return <CommunityDetail
      community={selected}
      bundle={bundle}
      membership={selectedMembership}
      detailTab={detailTab}
      setDetailTab={setDetailTab}
      detailLoading={detailLoading}
      busy={busy}
      error={error}
      message={message}
      canManage={canManage}
      canPublish={canPublish}
      isActiveMember={isActiveMember}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      user={user}
      profile={profile}
      setPage={setPage}
      showJoinCode={showJoinCode}
      setShowJoinCode={setShowJoinCode}
      onBack={() => { setSelectedId(null); setBundle(EMPTY_BUNDLE); }}
      onJoin={(code = null) => execute('join', async () => {
        const status = (!backendConnected || !hasSupabase)
          ? requestLocalJoin(selected.id, code)
          : await requestCommunityJoin(selected.id, code);
        setShowJoinCode(false);
        if (status === 'pending') setMessage('Solicitud enviada. El administrador debe aprobarla.');
        else setMessage('Ya eres miembro activo de esta comunidad.');
      })}
      onLeave={() => execute('leave', () => (!backendConnected || !hasSupabase) ? leaveLocalCommunity(selected.id) : leaveCommunity(selected.id), 'Saliste de la comunidad.')}
      onCreateAnnouncement={values => execute('announcement', () => (!backendConnected || !hasSupabase) ? createLocalAnnouncement(selected.id, values) : createAnnouncement(selected.id, user.id, values), 'Comunicado publicado.')}
      onCreateEvent={values => execute('event', () => (!backendConnected || !hasSupabase) ? createLocalEvent(selected.id, values) : createCommunityEvent(selected.id, user.id, values), 'Evento publicado.')}
      onCreateRoom={values => execute('room', () => (!backendConnected || !hasSupabase) ? createLocalRoom(selected.id, values) : createSchoolRoom(selected.id, user.id, values), 'Aula creada con chat escolar.')}
      onUploadDocument={(file, values) => execute('document', () => (!backendConnected || !hasSupabase) ? uploadLocalCommunityDocument(selected.id, file, values) : uploadCommunityDocument(selected.id, user.id, file, values), 'Documento subido.')}
      onDownloadDocument={async document => {
        setBusy(`download-${document.id}`);
        try {
          if (!backendConnected || !hasSupabase) {
            await openLocalCommunityDocument(document);
          } else {
            if (!document.storage_path) throw new Error('El archivo no tiene una ruta disponible.');
            const url = await createDocumentSignedUrl(document.storage_path);
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        } catch (requestError) {
          setError(requestError.message || 'No se pudo abrir el documento.');
        } finally {
          setBusy('');
        }
      }}
      onReviewMember={(member, status, role) => execute(`member-${member.user_id}`, () => (!backendConnected || !hasSupabase) ? reviewLocalMembership(selected.id, member.user_id, status, role) : reviewMembership(selected.id, member.user_id, status, role), 'Membresía actualizada.')}
    />;
  }

  const visibleTabs = isAdmin ? mainTabs : mainTabs.filter(item => item.id !== 'requests');
  const list = tab === 'mine' ? myCommunities : tab === 'requests' ? pendingCommunities : filtered.filter(item => item.status === 'active' || item.owner_id === user?.id || isAdmin);

  return <div className="page communityRealPage">
    <div className="pageTitle communityPageTitle">
      <div>
        <span className="eyebrow">ETAPA 15 · MULTIUSUARIO LOCAL</span>
        <h1>Mi Comunidad</h1>
        <p className="muted">Prueba comunidades completas entre perfiles locales, sin depender de Supabase.</p>
      </div>
      <div className="titleActions">
        <button className="ghost" onClick={() => loadBase()} disabled={loading}><RefreshCw size={17}/> Actualizar</button>
        <button className="primary" onClick={() => {
          if (!isAuthenticated && backendConnected) {
            setError('Inicia sesión desde Configuración para solicitar una comunidad.');
            return;
          }
          setShowCreate(true);
        }}><Plus size={18}/> Crear comunidad</button>
      </div>
    </div>

    {!backendConnected && <div className="communityDemoNotice localReady"><ShieldCheck size={18}/><div><b>Comunidad multiusuario local activa</b><span>Comunidades, miembros, solicitudes, comunicados, eventos, aulas y documentos se guardan en este navegador y se comparten entre pestañas.</span></div></div>}
    {error && <InlineAlert type="error" text={error} onClose={() => setError('')}/>}
    {message && <InlineAlert type="success" text={message} onClose={() => setMessage('')}/>}

    <div className="communityStats">
      <Stat icon={<Building2/>} value={communities.length} label="Comunidades visibles"/>
      <Stat icon={<Users/>} value={myCommunities.length} label="Mis comunidades"/>
      <Stat icon={<ShieldCheck/>} value={memberships.filter(item => item.status === 'pending').length} label="Solicitudes pendientes"/>
      <Stat icon={<GraduationCap/>} value={communities.filter(item => item.type === 'school').length} label="Colegios"/>
    </div>

    <Tabs tabs={visibleTabs} active={tab} setActive={setTab}/>

    {tab !== 'requests' && <div className="communityToolbar">
      <label className="communitySearch"><Search size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nombre, zona o tipo..."/></label>
      <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
        <option value="all">Todos los tipos</option>
        {Object.entries(TYPE_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
      </select>
    </div>}

    {loading ? <LoadingBlock text="Cargando comunidades..."/> : list.length === 0 ? <EmptyState
      icon={<Building2 size={34}/>} title={tab === 'mine' ? 'Aún no perteneces a una comunidad' : tab === 'requests' ? 'No hay solicitudes pendientes' : 'No encontramos resultados'}
      text={tab === 'mine' ? 'Explora comunidades activas o solicita una nueva.' : 'Prueba cambiando la búsqueda o los filtros.'}
    /> : <div className="communityGrid">
      {list.map(item => <CommunityCard
        key={item.id}
        community={item}
        membership={memberships.find(member => member.community_id === item.id)}
        isAdmin={isAdmin}
        busy={busy}
        onOpen={() => openCommunity(item)}
        onReview={status => execute(`review-${item.id}`, () => (!backendConnected || !hasSupabase) ? reviewLocalCommunity(item.id, status) : reviewCommunity(item.id, status), status === 'active' ? 'Comunidad aprobada.' : 'Comunidad rechazada.')}
      />)}
    </div>}

    {showCreate && <CreateCommunityModal
      busy={busy === 'create'}
      onClose={() => setShowCreate(false)}
      onSubmit={async values => {
        const ok = await execute('create', async () => {
          const created = (!backendConnected || !hasSupabase) ? createLocalCommunity(values) : await createCommunity(values);
          setSelectedId(created.id);
        }, isAdmin ? 'Comunidad creada.' : 'Solicitud enviada para revisión.');
        if (ok) setShowCreate(false);
      }}
    />}
  </div>;
}

function CommunityCard({ community, membership, isAdmin, busy, onOpen, onReview }) {
  const meta = TYPE_META[community.type] || TYPE_META.other;
  const status = membership?.status || community.status;
  return <article className="communityCardReal">
    <div className="communityCover">
      <span>{meta.icon}</span>
      <div className="communityCoverTags">
        <em className={`communityStatus ${community.status}`}>{STATUS_LABEL[community.status] || community.status}</em>
        {membership && <em className={`membershipStatus ${membership.status}`}>{membership.status === 'active' ? ROLE_LABEL[membership.role] : STATUS_LABEL[membership.status]}</em>}
      </div>
    </div>
    <div className="communityCardBody">
      <small>{meta.label} · {community.zone || 'Zona no indicada'}</small>
      <h3>{community.name}</h3>
      <p>{community.description || 'Esta comunidad todavía no agregó una descripción.'}</p>
      <div className="communityCardMeta"><span><Users size={15}/> {community.member_count || 0} miembros</span><span><LockKeyhole size={15}/> {community.join_mode === 'open' ? 'Ingreso abierto' : community.join_mode === 'code' ? 'Con código' : community.join_mode === 'invite' ? 'Por invitación' : 'Con aprobación'}</span></div>
      <button className="primary full" onClick={onOpen}>Abrir comunidad</button>
      {isAdmin && community.status === 'pending' && <div className="reviewButtons">
        <button onClick={() => onReview('active')} disabled={busy === `review-${community.id}`}><Check size={16}/> Aprobar</button>
        <button className="dangerSoft" onClick={() => onReview('rejected')} disabled={busy === `review-${community.id}`}><X size={16}/> Rechazar</button>
      </div>}
      {status === 'pending' && membership && <small className="waitingText">Tu solicitud está siendo revisada.</small>}
    </div>
  </article>;
}

function CommunityDetail(props) {
  const {
    community, bundle, membership, detailTab, setDetailTab, detailLoading, busy, error, message,
    canManage, canPublish, isActiveMember, isAuthenticated, isAdmin, user, profile, setPage,
    showJoinCode, setShowJoinCode, onBack, onJoin, onLeave, onCreateAnnouncement, onCreateEvent,
    onCreateRoom, onUploadDocument, onDownloadDocument, onReviewMember
  } = props;
  const meta = TYPE_META[community.type] || TYPE_META.other;
  const tabs = community.type === 'school' ? detailTabs : detailTabs.filter(item => item.id !== 'rooms');

  return <div className="page communityRealPage">
    <button className="communityBack" onClick={onBack}><ChevronLeft size={18}/> Volver a comunidades</button>
    <section className="communityHeroReal">
      <div className="communityHeroIcon">{meta.icon}</div>
      <div className="communityHeroText">
        <div className="communityHeroBadges"><span>{meta.label}</span><span>{community.zone || 'Sin zona'}</span><span className={community.status}>{STATUS_LABEL[community.status] || community.status}</span></div>
        <h1>{community.name}</h1>
        <p>{community.description || 'Comunidad de MiZona.'}</p>
        <div className="communityHeroMeta"><span><Users size={17}/> {community.member_count || 0} miembros</span><span><ShieldCheck size={17}/> {community.visibility === 'public' ? 'Comunidad pública' : 'Comunidad privada'}</span></div>
      </div>
      <div className="communityHeroActions">
        {!membership && <JoinButton community={community} isAuthenticated={isAuthenticated} busy={busy} showCode={showJoinCode} setShowCode={setShowJoinCode} onJoin={onJoin}/>} 
        {membership?.status === 'pending' && <button className="waitingButton" disabled><LoaderCircle size={17}/> Solicitud pendiente</button>}
        {isActiveMember && membership?.role !== 'owner' && <button className="ghost" onClick={onLeave} disabled={busy === 'leave'}>Salir</button>}
        {canManage && <span className="managerBadge"><ShieldCheck size={16}/> {isAdmin ? 'Administrador de plataforma' : ROLE_LABEL[membership?.role]}</span>}
      </div>
    </section>

    {error && <InlineAlert type="error" text={error}/>} {message && <InlineAlert type="success" text={message}/>} 
    {!isAuthenticated && <div className="communityLoginNotice"><CircleUserRound size={20}/><div><b>Inicia sesión para participar</b><span>Puedes ver contenido público, pero necesitas una cuenta para unirte, publicar o descargar archivos.</span></div><button onClick={() => setPage('settings')}>Ir a mi cuenta</button></div>}

    <Tabs tabs={tabs} active={detailTab} setActive={setDetailTab}/>
    {detailLoading ? <LoadingBlock text="Cargando contenido de la comunidad..."/> : <>
      {detailTab === 'home' && <CommunityHome community={community} bundle={bundle} canPublish={canPublish} onChangeTab={setDetailTab}/>} 
      {detailTab === 'announcements' && <AnnouncementsPanel bundle={bundle} canPublish={canPublish} busy={busy} onCreate={onCreateAnnouncement}/>} 
      {detailTab === 'events' && <EventsPanel bundle={bundle} canPublish={canPublish} busy={busy} onCreate={onCreateEvent}/>} 
      {detailTab === 'members' && <MembersPanel members={bundle.members} canManage={canManage} busy={busy} currentUserId={user?.id} onReview={onReviewMember}/>} 
      {detailTab === 'rooms' && <RoomsPanel rooms={bundle.rooms} canPublish={canPublish} busy={busy} onCreate={onCreateRoom} setPage={setPage}/>} 
      {detailTab === 'photos' && <PhotosPanel photos={bundle.photos || DEMO_BUNDLE.photos || []} canUpload={isActiveMember}/>} 
      {detailTab === 'documents' && <DocumentsPanel documents={bundle.documents} canUpload={isActiveMember} busy={busy} onUpload={onUploadDocument} onDownload={onDownloadDocument}/>} 
    </>}
  </div>;
}

function JoinButton({ community, isAuthenticated, busy, showCode, setShowCode, onJoin }) {
  if (!isAuthenticated) return <button className="primary" disabled><UserPlus size={17}/> Inicia sesión para unirte</button>;
  if (community.join_mode === 'invite') return <button className="waitingButton" disabled><LockKeyhole size={17}/> Solo por invitación</button>;
  if (community.join_mode === 'code') {
    return <div className="joinCodeBox">
      {!showCode ? <button className="primary" onClick={() => setShowCode(true)}><LockKeyhole size={17}/> Ingresar con código</button> : <JoinCodeForm busy={busy === 'join'} onCancel={() => setShowCode(false)} onSubmit={onJoin}/>} 
    </div>;
  }
  return <button className="primary" onClick={() => onJoin()} disabled={busy === 'join'}>{busy === 'join' ? <LoaderCircle className="spin" size={17}/> : <UserPlus size={17}/>} {community.join_mode === 'open' ? 'Unirme ahora' : 'Solicitar ingreso'}</button>;
}

function JoinCodeForm({ busy, onCancel, onSubmit }) {
  const [code, setCode] = useState('');
  return <form className="joinCodeForm" onSubmit={event => { event.preventDefault(); onSubmit(code); }}>
    <input value={code} onChange={event => setCode(event.target.value)} placeholder="Código" minLength={4} required/>
    <button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16}/> : <Check size={16}/>}</button>
    <button type="button" className="ghost" onClick={onCancel}><X size={16}/></button>
  </form>;
}

function CommunityHome({ community, bundle, canPublish, onChangeTab }) {
  const nextEvent = bundle.events.find(item => new Date(item.starts_at) >= new Date()) || bundle.events[0];
  return <div className="communityHomeGrid">
    <Card title="Últimos comunicados" icon={<Megaphone size={18}/>} action={<button className="linkButton" onClick={() => onChangeTab('announcements')}>Ver todos</button>}>
      {bundle.announcements.length === 0 ? <MiniEmpty text="Todavía no hay comunicados."/> : <div className="announcementCompactList">{bundle.announcements.slice(0, 3).map(item => <article key={item.id}><span>{item.is_pinned ? '📌' : '📢'}</span><div><b>{item.title}</b><p>{item.body}</p><small>{formatDate(item.published_at, true)}</small></div></article>)}</div>}
    </Card>
    <Card title="Próximo evento" icon={<CalendarDays size={18}/>} action={<button className="linkButton" onClick={() => onChangeTab('events')}>Calendario</button>}>
      {!nextEvent ? <MiniEmpty text="No hay eventos programados."/> : <div className="nextEventCard"><CalendarDays size={34}/><div><b>{nextEvent.title}</b><span>{formatDate(nextEvent.starts_at, true)}</span><span>{nextEvent.location || 'Ubicación por confirmar'}</span><p>{nextEvent.description}</p></div></div>}
    </Card>
    <Card title="Resumen" icon={<BarChart3 size={18}/>}>
      <div className="communitySummaryGrid">
        <div><b>{community.member_count || 0}</b><span>Miembros</span></div>
        <div><b>{bundle.announcements.length}</b><span>Comunicados</span></div>
        <div><b>{bundle.events.length}</b><span>Eventos</span></div>
        <div><b>{(bundle.photos || DEMO_BUNDLE.photos || []).length}</b><span>Fotos</span></div>
        <div><b>{bundle.documents.length}</b><span>Documentos</span></div>
      </div>
    </Card>
    <Card title="Funciones disponibles" icon={<Puzzle size={18}/>}>
      <div className="communityFeatureList"><span>📢 Comunicados oficiales</span><span>📅 Eventos y reuniones</span><span>👥 Gestión de miembros</span><span>📁 Documentos privados</span>{community.type === 'school' && <><span>🏫 Aulas escolares</span><span>🔒 Acceso dentro del colegio</span></>}</div>
      {canPublish && <small className="managerHint">Tienes permisos para publicar y administrar contenido.</small>}
    </Card>
  </div>;
}

function AnnouncementsPanel({ bundle, canPublish, busy, onCreate }) {
  const [showForm, setShowForm] = useState(false);
  return <div className="communitySectionStack">
    <SectionHeader title="Comunicados" subtitle="Información oficial de la comunidad." action={canPublish && <button className="primary" onClick={() => setShowForm(value => !value)}><Plus size={17}/> Nuevo comunicado</button>}/>
    {showForm && <AnnouncementForm busy={busy === 'announcement'} onCancel={() => setShowForm(false)} onSubmit={async values => { await onCreate(values); setShowForm(false); }}/>} 
    {bundle.announcements.length === 0 ? <EmptyState icon={<Megaphone size={34}/>} title="Sin comunicados" text="Los administradores y profesores podrán publicar aquí."/> : <div className="announcementListReal">{bundle.announcements.map(item => <article key={item.id} className={item.is_pinned ? 'pinned' : ''}><div className="announcementIcon">{item.is_pinned ? '📌' : '📢'}</div><div><div className="announcementTop"><h3>{item.title}</h3><span>{item.audience}</span></div><p>{item.body}</p><small>{formatDate(item.published_at, true)}</small></div></article>)}</div>}
  </div>;
}

function AnnouncementForm({ busy, onCancel, onSubmit }) {
  const [values, setValues] = useState({ title: '', body: '', audience: 'members', isPinned: false });
  return <form className="communityInlineForm" onSubmit={event => { event.preventDefault(); onSubmit(values); }}>
    <h3>Nuevo comunicado</h3>
    <div className="formGrid2"><label>Título<input value={values.title} onChange={event => setValues({ ...values, title: event.target.value })} minLength={3} maxLength={140} required/></label><label>Audiencia<select value={values.audience} onChange={event => setValues({ ...values, audience: event.target.value })}><option value="members">Miembros</option><option value="public">Público</option><option value="staff">Personal</option><option value="parents">Padres</option><option value="students">Estudiantes</option></select></label></div>
    <label>Mensaje<textarea value={values.body} onChange={event => setValues({ ...values, body: event.target.value })} minLength={3} maxLength={5000} rows={4} required/></label>
    <label className="checkRow"><input type="checkbox" checked={values.isPinned} onChange={event => setValues({ ...values, isPinned: event.target.checked })}/> Fijar este comunicado al inicio</label>
    <div className="formActions"><button type="button" className="ghost" onClick={onCancel}>Cancelar</button><button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <Megaphone size={17}/>} Publicar</button></div>
  </form>;
}

function EventsPanel({ bundle, canPublish, busy, onCreate }) {
  const [showForm, setShowForm] = useState(false);
  return <div className="communitySectionStack">
    <SectionHeader title="Eventos" subtitle="Reuniones, actividades y fechas importantes." action={canPublish && <button className="primary" onClick={() => setShowForm(value => !value)}><Plus size={17}/> Nuevo evento</button>}/>
    {showForm && <EventForm busy={busy === 'event'} onCancel={() => setShowForm(false)} onSubmit={async values => { await onCreate(values); setShowForm(false); }}/>} 
    {bundle.events.length === 0 ? <EmptyState icon={<CalendarDays size={34}/>} title="Sin eventos" text="Todavía no hay actividades programadas."/> : <div className="eventTimelineReal">{bundle.events.map(item => <article key={item.id}><div className="eventDateBox"><b>{new Date(item.starts_at).getDate()}</b><span>{new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(new Date(item.starts_at))}</span></div><div><h3>{item.title}</h3><span>{formatDate(item.starts_at, true)} · {item.location || 'Ubicación por confirmar'}</span><p>{item.description || 'Sin descripción.'}</p><small>Audiencia: {item.audience}</small></div></article>)}</div>}
  </div>;
}

function EventForm({ busy, onCancel, onSubmit }) {
  const initialDate = new Date(Date.now() + 3600000);
  initialDate.setMinutes(0, 0, 0);
  const [values, setValues] = useState({ title: '', description: '', location: '', startsAt: initialDate.toISOString().slice(0, 16), endsAt: '', audience: 'members' });
  return <form className="communityInlineForm" onSubmit={event => { event.preventDefault(); onSubmit(values); }}>
    <h3>Nuevo evento</h3>
    <div className="formGrid2"><label>Título<input value={values.title} onChange={event => setValues({ ...values, title: event.target.value })} required minLength={3}/></label><label>Lugar<input value={values.location} onChange={event => setValues({ ...values, location: event.target.value })}/></label><label>Inicio<input type="datetime-local" value={values.startsAt} onChange={event => setValues({ ...values, startsAt: event.target.value })} required/></label><label>Fin opcional<input type="datetime-local" value={values.endsAt} onChange={event => setValues({ ...values, endsAt: event.target.value })}/></label><label>Audiencia<select value={values.audience} onChange={event => setValues({ ...values, audience: event.target.value })}><option value="members">Miembros</option><option value="public">Público</option><option value="staff">Personal</option><option value="parents">Padres</option><option value="students">Estudiantes</option></select></label></div>
    <label>Descripción<textarea value={values.description} onChange={event => setValues({ ...values, description: event.target.value })} rows={3}/></label>
    <div className="formActions"><button type="button" className="ghost" onClick={onCancel}>Cancelar</button><button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <CalendarDays size={17}/>} Publicar evento</button></div>
  </form>;
}

function MembersPanel({ members, canManage, busy, currentUserId, onReview }) {
  const active = members.filter(item => item.status === 'active');
  const pending = members.filter(item => item.status === 'pending');
  return <div className="communitySectionStack">
    <SectionHeader title="Miembros" subtitle={`${active.length} miembros activos · ${pending.length} solicitudes pendientes`}/>
    {canManage && pending.length > 0 && <Card title="Solicitudes de ingreso" icon="⏳"><div className="memberListReal">{pending.map(member => <MemberRow key={member.user_id} member={member} busy={busy === `member-${member.user_id}`} canManage currentUserId={currentUserId} pending onReview={onReview}/>)}</div></Card>}
    <Card title="Miembros activos" icon={<Users size={18}/>}>{active.length === 0 ? <MiniEmpty text="No hay miembros activos visibles."/> : <div className="memberListReal">{active.map(member => <MemberRow key={member.user_id} member={member} busy={busy === `member-${member.user_id}`} canManage={canManage} currentUserId={currentUserId} onReview={onReview}/>)}</div>}</Card>
  </div>;
}

function MemberRow({ member, busy, canManage, currentUserId, pending = false, onReview }) {
  const [role, setRole] = useState(member.role === 'owner' ? 'owner' : member.role || 'member');
  const name = member.profile?.display_name || 'Usuario MiZona';
  const isOwner = member.role === 'owner';
  return <div className="memberRowReal">
    <div className="memberAvatar">{getInitials(name)}</div>
    <div className="memberIdentity"><b>{name}{member.user_id === currentUserId ? ' (Tú)' : ''}</b><span>@{String(member.profile?.username || 'usuario').toUpperCase()}</span><small>{ROLE_LABEL[member.role] || member.role} · {member.profile?.account_type || 'usuario'}</small></div>
    {canManage && !isOwner && member.user_id !== currentUserId ? <div className="memberActions">
      <select value={role} onChange={event => setRole(event.target.value)} disabled={busy}><option value="member">Miembro</option><option value="moderator">Moderador</option><option value="admin">Administrador</option><option value="teacher">Profesor</option><option value="parent">Padre/Madre</option><option value="student">Estudiante</option></select>
      {pending ? <><button onClick={() => onReview(member, 'active', role)} disabled={busy}><UserCheck size={16}/> Aprobar</button><button className="dangerSoft" onClick={() => onReview(member, 'rejected', role)} disabled={busy}><X size={16}/></button></> : <><button onClick={() => onReview(member, 'active', role)} disabled={busy}><Check size={16}/> Guardar</button><button className="dangerSoft" onClick={() => onReview(member, 'blocked', role)} disabled={busy}>Bloquear</button></>}
    </div> : <span className={`memberRoleBadge ${member.role}`}>{ROLE_LABEL[member.role] || member.role}</span>}
  </div>;
}

function RoomsPanel({ rooms, canPublish, busy, onCreate, setPage }) {
  const [showForm, setShowForm] = useState(false);
  return <div className="communitySectionStack">
    <SectionHeader title="Aulas escolares" subtitle="Solo integrantes del mismo colegio pueden acceder." action={canPublish && <button className="primary" onClick={() => setShowForm(value => !value)}><Plus size={17}/> Crear aula</button>}/>
    {showForm && <RoomForm busy={busy === 'room'} onCancel={() => setShowForm(false)} onSubmit={async values => { await onCreate(values); setShowForm(false); }}/>} 
    {rooms.length === 0 ? <EmptyState icon={<GraduationCap size={34}/>} title="Sin aulas" text="Los administradores o profesores pueden crear la primera aula."/> : <div className="roomGridReal">{rooms.map(room => <article key={room.id}><div className="roomIcon">🏫</div><div><h3>{room.name}</h3><span>{[room.grade, room.section].filter(Boolean).join(' · ') || 'Aula escolar'}</span><small>Acceso protegido por comunidad</small></div><button className="primary" onClick={() => setPage('chat')}>Abrir chat</button></article>)}</div>}
  </div>;
}

function RoomForm({ busy, onCancel, onSubmit }) {
  const [values, setValues] = useState({ name: '', grade: '', section: '' });
  return <form className="communityInlineForm" onSubmit={event => { event.preventDefault(); onSubmit(values); }}>
    <h3>Nueva aula</h3><div className="formGrid3"><label>Nombre<input value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} placeholder="Ejemplo: 5.º A" required/></label><label>Grado<input value={values.grade} onChange={event => setValues({ ...values, grade: event.target.value })} placeholder="Quinto"/></label><label>Sección<input value={values.section} onChange={event => setValues({ ...values, section: event.target.value })} placeholder="A"/></label></div><div className="formActions"><button type="button" className="ghost" onClick={onCancel}>Cancelar</button><button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <GraduationCap size={17}/>} Crear aula</button></div>
  </form>;
}


function PhotosPanel({ photos = [], canUpload }) {
  const [localPhotos, setLocalPhotos] = useState(photos);
  const addDemoPhoto = () => setLocalPhotos(current => [{ id: `local-photo-${Date.now()}`, title: 'Nueva foto de la comunidad', emoji: '📷', date: new Date().toISOString(), author: 'Miembro' }, ...current]);
  return <div className="communityPanel">
    <SectionHeader title="Fotos de la comunidad" subtitle="Galería visual para actividades, reuniones, eventos y recuerdos importantes." action={canUpload && <button className="primary" onClick={addDemoPhoto}><Image size={17}/> Agregar foto</button>}/>
    <div className="communityPhotoGrid">{localPhotos.map(photo => <article key={photo.id}>
      <div className="communityPhotoThumb"><span>{photo.emoji || '📸'}</span></div>
      <b>{photo.title}</b>
      <small>{photo.author || 'Comunidad'} · {formatDate(photo.date || photo.created_at, true)}</small>
      <button className="ghost">Ver / descargar</button>
    </article>)}</div>
    {!localPhotos.length && <EmptyState icon={<Camera size={18}/>} title="Todavía no hay fotos" text="Cuando subas fotos de actividades, eventos o reuniones aparecerán aquí."/>}
  </div>;
}

function DocumentsPanel({ documents, canUpload, busy, onUpload, onDownload }) {
  const [showForm, setShowForm] = useState(false);
  return <div className="communitySectionStack">
    <SectionHeader title="Documentos" subtitle="Archivos privados de hasta 20 MB para miembros de la comunidad." action={canUpload && <button className="primary" onClick={() => setShowForm(value => !value)}><Upload size={17}/> Subir archivo</button>}/>
    {showForm && <DocumentForm busy={busy === 'document'} onCancel={() => setShowForm(false)} onSubmit={async (file, values) => { await onUpload(file, values); setShowForm(false); }}/>} 
    {documents.length === 0 ? <EmptyState icon={<FileText size={34}/>} title="Sin documentos" text={canUpload ? 'Sube el primer archivo de la comunidad.' : 'Únete a la comunidad para acceder a sus documentos.'}/> : <div className="documentListReal">{documents.map(document => <article key={document.id}><div className="documentIcon"><FileText size={22}/></div><div><b>{document.title}</b><span>{document.file_name}</span><small>{formatBytes(document.size_bytes)} · {formatDate(document.created_at, true)}</small></div><button className="ghost" onClick={() => onDownload(document)} disabled={busy === `download-${document.id}`}>{busy === `download-${document.id}` ? <LoaderCircle className="spin" size={17}/> : <Download size={17}/>} Abrir</button></article>)}</div>}
  </div>;
}

function DocumentForm({ busy, onCancel, onSubmit }) {
  const [file, setFile] = useState(null);
  const [values, setValues] = useState({ title: '', visibility: 'members' });
  return <form className="communityInlineForm" onSubmit={event => { event.preventDefault(); onSubmit(file, values); }}>
    <h3>Subir documento</h3><div className="formGrid2"><label>Título<input value={values.title} onChange={event => setValues({ ...values, title: event.target.value })} placeholder="Nombre visible del documento"/></label><label>Visibilidad<select value={values.visibility} onChange={event => setValues({ ...values, visibility: event.target.value })}><option value="members">Todos los miembros</option><option value="staff">Solo personal</option><option value="parents">Padres</option><option value="students">Estudiantes</option></select></label></div><label>Archivo<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] || null)} required/><small>Máximo 20 MB.</small></label><div className="formActions"><button type="button" className="ghost" onClick={onCancel}>Cancelar</button><button className="primary" disabled={busy || !file}>{busy ? <LoaderCircle className="spin" size={17}/> : <Upload size={17}/>} Subir</button></div>
  </form>;
}

function CreateCommunityModal({ busy, onClose, onSubmit }) {
  const [values, setValues] = useState({ name: '', type: 'school', zone: '', description: '', visibility: 'public', joinMode: 'request', schoolLevel: 'Completo', inviteCode: '' });
  return <div className="communityModalBackdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="communityModal" onSubmit={event => { event.preventDefault(); onSubmit(values); }}>
      <div className="communityModalHeader"><div><span className="eyebrow">NUEVA COMUNIDAD</span><h2>Crear una comunidad</h2><p>En modo local, los administradores la activan de inmediato; otros perfiles envían una solicitud pendiente.</p></div><button type="button" className="iconBtn" onClick={onClose}><X size={20}/></button></div>
      <div className="formGrid2"><label>Nombre<input value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} minLength={3} maxLength={100} required placeholder="Ejemplo: Colegio San Martín"/></label><label>Tipo<select value={values.type} onChange={event => setValues({ ...values, type: event.target.value })}>{Object.entries(TYPE_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label><label>Zona o distrito<input value={values.zone} onChange={event => setValues({ ...values, zone: event.target.value })} placeholder="Ventanilla, Callao"/></label><label>Visibilidad<select value={values.visibility} onChange={event => setValues({ ...values, visibility: event.target.value })}><option value="public">Pública</option><option value="private">Privada</option><option value="school">Escolar</option></select></label><label>Forma de ingreso<select value={values.joinMode} onChange={event => setValues({ ...values, joinMode: event.target.value })}><option value="request">Con aprobación</option><option value="open">Ingreso abierto</option><option value="code">Con código</option><option value="invite">Solo invitación</option></select></label>{values.type === 'school' && <label>Nivel escolar<select value={values.schoolLevel} onChange={event => setValues({ ...values, schoolLevel: event.target.value })}><option>Inicial</option><option>Primaria</option><option>Secundaria</option><option>Primaria y secundaria</option><option>Completo</option></select></label>}{values.joinMode === 'code' && <label>Código inicial<input value={values.inviteCode} onChange={event => setValues({ ...values, inviteCode: event.target.value })} minLength={4} required placeholder="Mínimo 4 caracteres"/></label>}</div>
      <label>Descripción<textarea value={values.description} onChange={event => setValues({ ...values, description: event.target.value })} rows={4} placeholder="Explica para quién es la comunidad y qué objetivo tiene."/></label>
      <div className="communityModalHelp">
        <div><ShieldCheck size={18}/><b>Visibilidad</b><p><strong>Pública:</strong> aparece en búsqueda. <strong>Privada:</strong> solo se entra con invitación o aprobación. <strong>Escolar:</strong> comunidad protegida para colegio/aulas.</p></div>
        <div><UserCheck size={18}/><b>Forma de ingreso</b><p><strong>Con aprobación:</strong> el administrador acepta. <strong>Ingreso abierto:</strong> entran directo. <strong>Con código:</strong> necesitan código. <strong>Solo invitación:</strong> el dueño agrega.</p></div>
      </div>
      <div className="communityModalInfo"><ShieldCheck size={18}/><span>El propietario administra integrantes, fotos, documentos y contenido. Los administradores también pueden aprobar solicitudes pendientes.</span></div>
      <div className="formActions"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <Plus size={17}/>} Guardar comunidad</button></div>
    </form>
  </div>;
}

function Stat({ icon, value, label }) { return <div className="communityStat"><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>; }
function SectionHeader({ title, subtitle, action }) { return <div className="communitySectionHeader"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>; }
function LoadingBlock({ text }) { return <div className="communityLoading"><LoaderCircle className="spin" size={28}/><span>{text}</span></div>; }
function MiniEmpty({ text }) { return <div className="miniEmpty">{text}</div>; }
function EmptyState({ icon, title, text }) { return <div className="communityEmpty"><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>; }
function InlineAlert({ type, text, onClose }) { return <div className={`communityAlert ${type}`}>{type === 'success' ? <Check size={18}/> : <AlertCircle size={18}/>}<span>{text}</span>{onClose && <button onClick={onClose}><X size={16}/></button>}</div>; }

export function SchoolPage({ setPage }) {
  return <Community setPage={setPage} autoSelectType="school"/>;
}
