import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Gift,
  Heart,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Tag,
  Ticket,
  Users,
  X
} from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import {
  cancelLocalOpportunityAction,
  createLocalOpportunity,
  formatOpportunityExpiry,
  getLocalBenefitsSnapshot,
  performLocalOpportunityAction,
  registerLocalOpportunityView,
  reportLocalOpportunity,
  subscribeLocalBenefits,
  toggleLocalFavorite
} from '../lib/localBenefits';

const categories = [
  { id: 'all', label: 'Todo', icon: '✨' },
  { id: 'offers', label: 'Comida', icon: '🍔' },
  { id: 'jobs', label: 'Trabajo', icon: '💼' },
  { id: 'events', label: 'Eventos', icon: '🎟️' },
  { id: 'campaigns', label: 'Campañas', icon: '❤️' },
  { id: 'coupons', label: 'Cupones', icon: '🏷️' }
];

const modeTabs = [
  { id: 'discover', label: 'Promos', icon: '🏷️' },
  { id: 'saved', label: 'Guardados', icon: '⭐' },
  { id: 'actions', label: 'Mis compras', icon: '🛍️' },
  { id: 'publications', label: 'Publicar', icon: '📣' }
];

const iconByType = { offers: Tag, jobs: BriefcaseBusiness, events: CalendarDays, campaigns: Heart, coupons: Ticket };
const labelByStatus = { active: 'Activa', pending: 'Pendiente', rejected: 'Rechazada', paused: 'Pausada', expired: 'Vencida' };

const emptyForm = () => ({
  type: 'offers',
  title: '',
  ownerName: '',
  zone: '',
  badge: '',
  price: '',
  previous: '',
  expiresAt: '',
  image: '🏷️',
  actionLabel: '',
  description: '',
  stock: 10
});

function actionMessage(item, action) {
  if (action.action_type === 'coupon') return `Cupón generado: ${action.coupon_code}`;
  if (action.action_type === 'application') return `Postulación registrada para “${item.title}”.`;
  if (action.action_type === 'attendance') return `Asistencia registrada para “${item.title}”.`;
  if (action.action_type === 'participation') return `Participación registrada para “${item.title}”.`;
  return `Solicitud registrada para “${item.title}”.`;
}

export default function Benefits() {
  const { profile } = useApp();
  const [snapshot, setSnapshot] = useState(getLocalBenefitsSnapshot);
  const [mode, setMode] = useState('discover');
  const [active, setActive] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeLocalBenefits(setSnapshot), []);
  useEffect(() => setSnapshot(getLocalBenefitsSnapshot()), [profile.id]);

  const allById = useMemo(() => Object.fromEntries(snapshot.opportunities.map(item => [item.id, item])), [snapshot.opportunities]);
  const activeItems = useMemo(() => snapshot.opportunities.filter(item => item.status === 'active'), [snapshot.opportunities]);

  const filtered = useMemo(() => {
    let list = activeItems;
    if (mode === 'saved') list = activeItems.filter(item => snapshot.myFavoriteIds.includes(item.id));
    if (mode === 'publications') list = snapshot.myPublications;
    if (active !== 'all' && mode !== 'actions') list = list.filter(item => item.type === active);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(item => `${item.title} ${item.owner_name} ${item.zone} ${item.description}`.toLowerCase().includes(q));
    return list;
  }, [activeItems, snapshot.myFavoriteIds, snapshot.myPublications, active, query, mode]);

  const showNotice = message => {
    setError('');
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const openDetails = item => {
    registerLocalOpportunityView(item.id);
    setSelected(item);
  };

  const toggleSaved = item => {
    try {
      const saved = toggleLocalFavorite(item.id);
      showNotice(saved ? 'Oportunidad guardada.' : 'Oportunidad retirada de guardados.');
    } catch (err) {
      setError(err.message);
    }
  };

  const act = item => {
    try {
      const action = performLocalOpportunityAction(item.id);
      showNotice(actionMessage(item, action));
      setSelected(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitCreate = event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const opportunity = createLocalOpportunity(form);
      setShowCreate(false);
      setForm(emptyForm());
      setMode('publications');
      showNotice(opportunity.status === 'active' ? 'Publicación creada y activada.' : 'Publicación enviada para revisión administrativa.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const report = item => {
    const reason = window.prompt('Motivo del reporte (por ejemplo: información falsa, vencida o inapropiada):');
    if (!reason) return;
    try {
      reportLocalOpportunity(item.id, reason);
      showNotice('Reporte enviado al Centro de Control.');
      setSelected(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const myActionRows = snapshot.myActions.map(action => ({ action, item: allById[action.opportunity_id] })).filter(row => row.item);
  const counts = useMemo(() => ({
    offers: activeItems.filter(item => item.type === 'offers').length,
    jobs: activeItems.filter(item => item.type === 'jobs').length,
    events: activeItems.filter(item => item.type === 'events').length,
    campaigns: activeItems.filter(item => item.type === 'campaigns').length
  }), [activeItems]);

  const featured = activeItems.slice(0, 5);
  const brandItems = [
    { label: 'MiPlaza', icon: '🛒' },
    { label: 'Cine', icon: '🎬' },
    { label: 'Saboría', icon: '🍔' },
    { label: 'EduPlus', icon: '🎓' },
    { label: 'MoviGo', icon: '🚗' },
    { label: 'Más', icon: '+' }
  ];

  return <div className="page benefitsPage benefitsLocalV16 yapeBenefitsPro">
    <section className="benefitsHero benefitsHeroV16 yapeBenefitsHero">
      <div className="yapeBenefitsTop">
        <div>
          <p className="eyebrow">MiZona beneficios</p>
          <h1>Descuentos y oportunidades para tu zona</h1>
          <p>Encuentra promos, campañas, cursos, servicios y beneficios verificados.</p>
        </div>
        <button className="benefitCreateButton" onClick={() => setShowCreate(true)}><Plus size={17}/> Publicar</button>
      </div>
      <div className="benefitSearch yapeSearch"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca beneficios, marcas o categorías" /></div>
      <div className="yapePromoBanner">
        <div>
          <span>Días MiZona</span>
          <strong>Beneficios que ayudan todos los días</strong>
          <small>Hasta 60% dscto. en promos y servicios aliados</small>
        </div>
        <b>60%</b>
      </div>
    </section>

    <div className="yapeBrands">
      <div className="sectionLine"><h2>Marcas aliadas</h2><button onClick={() => setActive('all')}>Ver todas</button></div>
      <div className="brandScroller">{brandItems.map(item => <button key={item.label} type="button" onClick={() => setActive('all')}><span>{item.icon}</span><small>{item.label}</small></button>)}</div>
    </div>

    <div className="benefitStats yapeStats">
      <span><Gift size={18}/> {counts.offers} ofertas</span>
      <span><BriefcaseBusiness size={18}/> {counts.jobs} empleos</span>
      <span><CalendarDays size={18}/> {counts.events} eventos</span>
      <span><Heart size={18}/> {counts.campaigns} campañas</span>
    </div>

    <Tabs tabs={modeTabs} active={mode} setActive={setMode}/>
    {mode !== 'actions' && <Tabs tabs={categories} active={active} setActive={setActive}/>} 

    {mode === 'discover' && featured.length > 0 && <section className="yapeFeatured">
      <div className="sectionLine"><h2>Beneficios destacados</h2><button onClick={() => { setActive('all'); setQuery(''); }}>Ver más</button></div>
      <div className="featuredScroller">{featured.map(item => <button key={item.id} type="button" className="featuredCard" onClick={() => openDetails(item)}>
        <span className="discountBadge">{item.badge || 'Nuevo'}</span>
        <strong>{item.image}</strong>
        <b>{item.title}</b>
        <small>{item.price}</small>
      </button>)}</div>
    </section>}

    {mode !== 'actions' && <>
      <div className="benefitToolbar">
        <p><b>{filtered.length}</b> resultados · Perfil activo: <strong>@{profile.username}</strong></p>
        <button className="ghost" onClick={() => { setActive('all'); setQuery(''); }}>Limpiar filtros</button>
      </div>

      <div className="opportunityGrid">
        {filtered.map(item => {
          const TypeIcon = iconByType[item.type] || Gift;
          const saved = snapshot.myFavoriteIds.includes(item.id);
          const mine = item.owner_id === profile.id;
          return <article className={`opportunityCard ${item.status !== 'active' ? 'opportunityInactive' : ''}`} key={item.id}>
            <button className={`saveBtn ${saved ? 'saved' : ''}`} onClick={() => toggleSaved(item)} aria-label="Guardar"><Heart size={18} fill={saved ? 'currentColor' : 'none'}/></button>
            <div className="opportunityVisual"><span>{item.image}</span><i>{item.badge}</i>{mine && <small className="mineBadge">Tu publicación</small>}</div>
            <div className="opportunityBody">
              <div className="opportunityType"><TypeIcon size={15}/>{categories.find(category => category.id === item.type)?.label}{item.verified && <em><Check size={12}/> Verificada</em>}</div>
              <h3>{item.title}</h3>
              <p className="ownerName">{item.owner_name}</p>
              <p className="locationLine"><MapPin size={15}/>{item.zone} · {item.distance}</p>
              <div className="priceLine"><b>{item.price}</b>{item.previous && <del>{item.previous}</del>}</div>
              <p className="expiry"><Clock3 size={14}/>{formatOpportunityExpiry(item.expires_at)} · {Number(item.stock || 0)} cupos</p>
              {item.status !== 'active' && <span className={`publicationState ${item.status}`}>{labelByStatus[item.status] || item.status}</span>}
              <div className="cardActions">
                {item.status === 'active' && !mine && <button className="primary" onClick={() => act(item)}>{item.action_label}</button>}
                <button className="ghost" onClick={() => openDetails(item)}>Detalles</button>
              </div>
            </div>
          </article>;
        })}
      </div>

      {!filtered.length && <div className="emptyState"><Search size={38}/><h3>No encontramos coincidencias</h3><p>Cambia el filtro o crea una nueva oportunidad.</p><button className="primary" onClick={() => setShowCreate(true)}>Publicar oportunidad</button></div>}
    </>}

    {mode === 'actions' && <div className="benefitActionWorkspace">
      <Card title="Mis beneficios y acciones" icon="🎟️">
        <p className="muted">Cada perfil conserva sus cupones, postulaciones, reservas y asistencias.</p>
        <div className="benefitActionList">
          {myActionRows.map(({ action, item }) => <article key={action.id}>
            <div className="benefitActionIcon">{item.image}</div>
            <div>
              <b>{item.title}</b>
              <span>{item.owner_name} · {new Date(action.created_at).toLocaleString('es-PE')}</span>
              <small>{action.action_type} · {action.status}</small>
            </div>
            {action.coupon_code && <code>{action.coupon_code}</code>}
            {action.status !== 'cancelled' && <button className="ghost" onClick={() => { try { cancelLocalOpportunityAction(action.id); showNotice('Acción cancelada.'); } catch (err) { setError(err.message); } }}>Cancelar</button>}
          </article>)}
          {!myActionRows.length && <div className="emptyInline"><Ticket size={30}/><p>Todavía no registraste beneficios.</p><button className="primary" onClick={() => setMode('discover')}>Explorar oportunidades</button></div>}
        </div>
      </Card>
      <Card title="Cómo se comparte entre perfiles" icon="🔄">
        <ul className="list">
          <li>Abre una segunda pestaña y selecciona otro perfil.</li>
          <li>Publica una oferta, empleo, evento, campaña o cupón.</li>
          <li>Un administrador aprueba las publicaciones pendientes.</li>
          <li>El otro perfil puede guardar o ejecutar la acción.</li>
          <li>El responsable recibe una notificación local.</li>
        </ul>
      </Card>
    </div>}

    {selected && <div className="modalBackdrop" onClick={() => setSelected(null)}><div className="detailModal benefitDetailV16" onClick={event => event.stopPropagation()}>
      <button className="modalClose" onClick={() => setSelected(null)}>×</button>
      <div className="detailIcon">{selected.image}</div>
      <p className="eyebrow">{selected.badge}</p>
      <h2>{selected.title}</h2>
      <p>{selected.description}</p>
      <div className="detailFacts">
        <span><Users size={16}/>{selected.owner_name}</span>
        <span><MapPin size={16}/>{selected.zone} · {selected.distance}</span>
        <span><Clock3 size={16}/>{formatOpportunityExpiry(selected.expires_at)}</span>
        <span><BadgeCheck size={16}/>{selected.verified ? 'Responsable verificado' : 'Pendiente de verificación'}</span>
      </div>
      <div className="benefitDetailMetrics"><span><b>{selected.views || 0}</b> vistas</span><span><b>{selected.action_count || 0}</b> acciones</span><span><b>{selected.stock || 0}</b> cupos</span></div>
      {selected.status === 'active' && selected.owner_id !== profile.id && <button className="primary full" onClick={() => act(selected)}>{selected.action_label}</button>}
      {selected.owner_id !== profile.id && <button className="reportOpportunity" onClick={() => report(selected)}><AlertTriangle size={16}/> Reportar publicación</button>}
    </div></div>}

    {showCreate && <div className="modalBackdrop" onClick={() => setShowCreate(false)}><form className="benefitCreateModal" onSubmit={submitCreate} onClick={event => event.stopPropagation()}>
      <div className="benefitModalHead"><div><p className="eyebrow">Nueva oportunidad</p><h2>Publicar en MiZona</h2></div><button type="button" onClick={() => setShowCreate(false)}><X size={20}/></button></div>
      <p className="muted">Los administradores publican directamente. Los demás perfiles envían la publicación a revisión.</p>
      <div className="benefitFormGrid">
        <label>Categoría<select value={form.type} onChange={event => setForm(value => ({ ...value, type: event.target.value, image: ({ offers: '🏷️', jobs: '💼', events: '🎉', campaigns: '❤️', coupons: '🎟️' })[event.target.value] }))}>{categories.filter(item => item.id !== 'all').map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Ícono<input value={form.image} maxLength={4} onChange={event => setForm(value => ({ ...value, image: event.target.value }))}/></label>
        <label className="wide">Título<input value={form.title} onChange={event => setForm(value => ({ ...value, title: event.target.value }))} placeholder="Ejemplo: 20% en mantenimiento de bicicletas"/></label>
        <label>Responsable<input value={form.ownerName} onChange={event => setForm(value => ({ ...value, ownerName: event.target.value }))} placeholder={profile.displayName}/></label>
        <label>Zona<input value={form.zone} onChange={event => setForm(value => ({ ...value, zone: event.target.value }))} placeholder={profile.zone}/></label>
        <label>Precio o dato principal<input value={form.price} onChange={event => setForm(value => ({ ...value, price: event.target.value }))} placeholder="S/ 49.90, Gratis, Pago diario..."/></label>
        <label>Etiqueta<input value={form.badge} onChange={event => setForm(value => ({ ...value, badge: event.target.value }))} placeholder="35% menos, Cupos limitados..."/></label>
        <label>Vigencia<input type="datetime-local" value={form.expiresAt} onChange={event => setForm(value => ({ ...value, expiresAt: event.target.value }))}/></label>
        <label>Cupos o stock<input type="number" min="0" value={form.stock} onChange={event => setForm(value => ({ ...value, stock: event.target.value }))}/></label>
        <label className="wide">Descripción<textarea value={form.description} onChange={event => setForm(value => ({ ...value, description: event.target.value }))} placeholder="Condiciones, horarios, requisitos y restricciones."/></label>
      </div>
      <div className="benefitFormActions"><button type="button" className="ghost" onClick={() => setShowCreate(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Guardando...' : 'Publicar oportunidad'}</button></div>
    </form></div>}

    {notice && <div className="toastSuccess"><Check size={17}/>{notice}</div>}
    {error && <div className="toastError"><AlertTriangle size={17}/>{error}<button onClick={() => setError('')}>×</button></div>}
  </div>;
}
