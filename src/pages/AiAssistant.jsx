import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, Bot, BriefcaseBusiness, Building2, Check, ChevronRight, Clock3,
  GraduationCap, Heart, History, Lightbulb, Loader2, MapPin, MessageSquareText,
  Plus, RotateCcw, Save, Send, Settings2, ShieldAlert, ShieldCheck, Sparkles,
  Store, ThumbsDown, ThumbsUp, Trash2, WandSparkles, Car, X
} from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import { useApp } from '../context/AppContext';
import { isPlatformAdmin, isStudentProfile } from '../lib/permissions';
import {
  askLocalAi,
  createLocalAiConversation,
  deleteLocalAiConversation,
  deleteLocalAiPlan,
  getLocalAiSnapshot,
  localAiUserLabel,
  rateLocalAiMessage,
  resetLocalAi,
  reviewLocalAiFlag,
  saveLocalAiPlan,
  subscribeLocalAi,
  toggleLocalAiFavorite,
  updateLocalAiSettings
} from '../lib/localAi';

const starters = [
  '¿Qué actividades y pendientes tengo hoy?',
  'Ayúdame a organizar los gastos de mi comité',
  'Crea una oferta para aumentar ventas',
  'Recomiéndame una ruta de Excel desde cero',
  '¿Qué opciones tengo cerca de mi zona?',
  'Prepara una lista de seguridad para un viaje'
];

const specialists = [
  { id: 'general', icon: Bot, title: 'General', text: 'Encuentra el módulo y la secuencia correcta.' },
  { id: 'community', icon: Building2, title: 'Comunidad', text: 'Comités, comunicados, reuniones, eventos y gastos.' },
  { id: 'business', icon: BriefcaseBusiness, title: 'Negocio', text: 'Caja, inventario, ventas, clientes y promociones.' },
  { id: 'education', icon: GraduationCap, title: 'Aprendizaje', text: 'Cursos, tareas, prácticas y rutas de estudio.' },
  { id: 'local', icon: MapPin, title: 'Mi zona', text: 'Beneficios, negocios, servicios y Marketplace.' },
  { id: 'ride', icon: Car, title: 'Ride', text: 'Viajes, delivery, conductores y seguridad.' }
];

const pageLabels = {
  panel: 'Mi Panel', community: 'Mi Comunidad', committees: 'Comités', business: 'MiZona Business',
  benefits: 'Beneficios', businesses: 'Negocios', marketplace: 'Marketplace', campus: 'CampusHugo',
  ride: 'MiZona Ride', chat: 'MiZona Chat', notifications: 'Notificaciones', settings: 'Configuración'
};

export default function AiAssistant({ setPage }) {
  const { profile } = useApp();
  const admin = isPlatformAdmin(profile);
  const student = isStudentProfile(profile);
  const [snapshot, setSnapshot] = useState(() => getLocalAiSnapshot());
  const [tab, setTab] = useState('assistant');
  const [activeId, setActiveId] = useState(() => getLocalAiSnapshot().conversations[0]?.id || null);
  const [specialist, setSpecialist] = useState('general');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [settingsDraft, setSettingsDraft] = useState(() => getLocalAiSnapshot().settings);
  const messageEnd = useRef(null);

  const reload = () => {
    const next = getLocalAiSnapshot();
    setSnapshot(next);
    setSettingsDraft(next.settings);
    setActiveId(current => current && next.conversations.some(item => item.id === current) ? current : next.conversations[0]?.id || null);
  };

  useEffect(() => subscribeLocalAi(reload), []);
  useEffect(() => { messageEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [activeId, snapshot.conversations, loading]);

  const active = useMemo(() => snapshot.conversations.find(item => item.id === activeId) || null, [snapshot.conversations, activeId]);
  const favoritePrompts = snapshot.favorites.map(item => item.prompt);
  const endpointConfigured = Boolean(import.meta.env.VITE_AI_ENDPOINT);
  const tabs = [
    { id: 'assistant', label: 'Asistente' },
    { id: 'history', label: `Historial (${snapshot.conversations.length})` },
    { id: 'plans', label: `Planes guardados (${snapshot.savedPlans.length})` },
    ...(admin ? [{ id: 'admin', label: 'Administración IA' }] : [])
  ];

  const createConversation = (selected = specialist) => {
    const id = createLocalAiConversation({ specialist: selected });
    setActiveId(id);
    setSpecialist(selected);
    setTab('assistant');
    setMessage('Nueva conversación creada.');
  };

  const ask = async value => {
    const prompt = String(value ?? input).trim();
    if (!prompt || loading) return;
    setLoading(true);
    setMessage('');
    try {
      let conversationId = activeId;
      if (!conversationId) conversationId = createLocalAiConversation({ title: prompt.slice(0, 60), specialist });
      setActiveId(conversationId);
      setInput('');
      await askLocalAi({ conversationId, prompt, specialist, endpoint: import.meta.env.VITE_AI_ENDPOINT || '' });
      reload();
    } catch (error) {
      setMessage(error.message || 'No fue posible procesar la consulta.');
    } finally {
      setLoading(false);
    }
  };

  const removeConversation = id => {
    if (!confirm('¿Eliminar esta conversación local?')) return;
    try { deleteLocalAiConversation(id); reload(); } catch (error) { setMessage(error.message); }
  };

  const savePlan = (conversationId, messageId) => {
    try { saveLocalAiPlan(conversationId, messageId); setMessage('Plan guardado en tu perfil local.'); reload(); }
    catch (error) { setMessage(error.message); }
  };

  const saveSettings = () => {
    try { updateLocalAiSettings(settingsDraft); setMessage('Configuración local de IA actualizada.'); reload(); }
    catch (error) { setMessage(error.message); }
  };

  if (student) return <div className="page"><Card title="IA MiZona no disponible" icon="🛡️"><p className="muted">La cuenta estudiantil no tiene acceso al asistente general. Continúa usando Comunidad escolar, Chat seguro, Transfer y CampusHugo.</p></Card></div>;

  return <div className="page aiPage aiV21">
    <section className="aiHero">
      <div>
        <p className="eyebrow">Etapa 21 · Asistente multiusuario local</p>
        <h1>IA MiZona</h1>
        <p>Consulta los datos guardados en este navegador y convierte una necesidad en un plan con accesos directos a los módulos.</p>
        <div className="aiMode"><Sparkles size={17}/>{endpointConfigured ? 'Endpoint opcional configurado · respaldo local activo' : 'Motor local activo · sin Supabase ni claves externas'}</div>
      </div>
      <div className="aiHeroVisual"><div className="aiOrb"><Bot size={52}/></div><span>Resolver</span><span>Organizar</span><span>Aprender</span><span>Crecer</span></div>
    </section>

    <div className="aiContextStrip">
      <span><Building2 size={17}/><b>{snapshot.context.counts.communities}</b> comunidades</span>
      <span><MessageSquareText size={17}/><b>{snapshot.context.counts.conversations}</b> chats</span>
      <span><Store size={17}/><b>{snapshot.context.counts.benefits}</b> beneficios</span>
      <span><GraduationCap size={17}/><b>{snapshot.context.counts.courses_enrolled}</b> cursos</span>
      <span><BriefcaseBusiness size={17}/><b>{snapshot.context.counts.business_workspaces}</b> negocios</span>
      <span><Car size={17}/><b>{snapshot.context.counts.rides + snapshot.context.counts.deliveries}</b> servicios Ride</span>
    </div>

    <Tabs tabs={tabs} active={tab} setActive={setTab}/>
    {message && <div className="aiNotice"><Lightbulb size={17}/>{message}<button onClick={() => setMessage('')}><X size={16}/></button></div>}

    {tab === 'assistant' && <div className="aiLayout aiLayoutV21">
      <aside className="aiConversationRail">
        <button className="aiNewButton" onClick={() => createConversation()}><Plus size={17}/>Nueva conversación</button>
        <div className="aiHistoryMini">
          {snapshot.conversations.slice(0, 12).map(item => <button key={item.id} className={item.id === activeId ? 'active' : ''} onClick={() => { setActiveId(item.id); setSpecialist(item.specialist || 'general'); }}>
            <span><History size={15}/><b>{item.title}</b></span><small>{new Date(item.updated_at).toLocaleString('es-PE')}</small>
          </button>)}
          {!snapshot.conversations.length && <p className="muted">Todavía no hay conversaciones.</p>}
        </div>
      </aside>

      <section className="aiChatCard aiChatV21">
        <header>
          <div><WandSparkles size={21}/><div><b>{active?.title || 'Nueva conversación'}</b><span>@{profile.username} · historial privado de este perfil local</span></div></div>
          {active && <button onClick={() => removeConversation(active.id)}><Trash2 size={15}/>Eliminar</button>}
        </header>

        <div className="aiSpecialistBar">
          {specialists.map(item => { const Icon = item.icon; return <button key={item.id} className={specialist === item.id ? 'active' : ''} onClick={() => setSpecialist(item.id)} title={item.text}><Icon size={16}/>{item.title}</button>; })}
        </div>

        <div className="aiMessages aiMessagesV21">
          {!active?.messages?.length && <div className="aiEmpty"><Bot size={42}/><b>¿Qué necesitas resolver?</b><p>Selecciona un especialista o utiliza una pregunta sugerida.</p></div>}
          {(active?.messages || []).map(item => <div key={item.id} className={`aiMessage ${item.role}`}>
            <span>{item.role === 'assistant' ? <Bot size={18}/> : String(profile.displayName || 'U').slice(0, 2).toUpperCase()}</span>
            <div className="aiMessageBody">
              {item.title && <b>{item.title}</b>}
              <p>{item.text}</p>
              {!!item.checklist?.length && <ul>{item.checklist.map(line => <li key={line}><Check size={14}/>{line}</li>)}</ul>}
              {!!item.actions?.length && <div className="aiActionButtons">{item.actions.map(action => <button key={`${item.id}-${action.page}`} onClick={() => setPage?.(action.page)}>{action.label || pageLabels[action.page] || action.page}<ChevronRight size={14}/></button>)}</div>}
              {item.role === 'assistant' && <div className="aiMessageTools">
                <button onClick={() => savePlan(active.id, item.id)}><Save size={14}/>Guardar plan</button>
                <button onClick={() => rateLocalAiMessage(active.id, item.id, 'up')}><ThumbsUp size={14}/></button>
                <button onClick={() => rateLocalAiMessage(active.id, item.id, 'down')}><ThumbsDown size={14}/></button>
                <small>{item.source === 'safety' ? 'Protección local' : item.source?.includes('endpoint') ? 'Endpoint o respaldo local' : 'Motor local'}</small>
              </div>}
            </div>
          </div>)}
          {loading && <div className="aiMessage assistant"><span><Bot size={18}/></span><div className="aiMessageBody"><p className="typing"><Loader2 size={17}/>Analizando los módulos locales...</p></div></div>}
          <div ref={messageEnd}/>
        </div>

        <div className="aiSuggestions">
          {[...favoritePrompts, ...starters].filter((item, index, rows) => rows.indexOf(item) === index).slice(0, 6).map(item => <button key={item} onClick={() => ask(item)}>{favoritePrompts.includes(item) && <Heart size={13} fill="currentColor"/>}{item}</button>)}
        </div>
        <form className="aiComposer" onSubmit={event => { event.preventDefault(); ask(); }}>
          <textarea value={input} maxLength={snapshot.settings.max_prompt_chars} onChange={event => setInput(event.target.value)} placeholder="Ejemplo: crea un plan para organizar una reunión, responsables, gastos y publicación de acuerdos..." rows="3"/>
          <button disabled={loading || !input.trim()}><Send size={19}/></button>
        </form>
        <footer><ShieldCheck size={15}/>{snapshot.settings.safety_notice}<span>{input.length}/{snapshot.settings.max_prompt_chars}</span></footer>
      </section>

      <aside className="aiSide">
        <Card title="Especialistas" icon="✨"><div className="assistantCards">{specialists.slice(1).map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => { setSpecialist(item.id); createConversation(item.id); }}><span><Icon size={19}/></span><div><b>{item.title}</b><p>{item.text}</p></div></button>; })}</div></Card>
        <Card title="Preguntas favoritas" icon="❤️"><div className="aiFavoriteList">{favoritePrompts.map(prompt => <div key={prompt}><button onClick={() => ask(prompt)}>{prompt}</button><button onClick={() => { toggleLocalAiFavorite(prompt); reload(); }}><Trash2 size={14}/></button></div>)}{!favoritePrompts.length && <p className="muted">Guarda preguntas frecuentes desde esta sección.</p>}<button className="primary full" onClick={() => { if (input.trim()) { toggleLocalAiFavorite(input); reload(); } else setMessage('Escribe primero una pregunta para guardarla.'); }}><Heart size={15}/>Guardar texto actual</button></div></Card>
      </aside>
    </div>}

    {tab === 'history' && <div className="aiHistoryGrid">
      {snapshot.conversations.map(item => <article key={item.id}>
        <div><History size={20}/><span><b>{item.title}</b><small>{item.messages.length} mensajes · {new Date(item.updated_at).toLocaleString('es-PE')}</small></span></div>
        <p>{item.messages.slice(-1)[0]?.text || 'Conversación vacía'}</p>
        <footer><button onClick={() => { setActiveId(item.id); setSpecialist(item.specialist || 'general'); setTab('assistant'); }}>Abrir</button><button onClick={() => removeConversation(item.id)}><Trash2 size={15}/></button></footer>
      </article>)}
      {!snapshot.conversations.length && <Card title="Sin historial" icon="🕘"><p className="muted">Crea tu primera conversación con IA MiZona.</p></Card>}
    </div>}

    {tab === 'plans' && <div className="aiPlanGrid">
      {snapshot.savedPlans.map(plan => <article key={plan.id}>
        <header><Archive size={20}/><div><b>{plan.title}</b><small>{new Date(plan.created_at).toLocaleString('es-PE')}</small></div></header>
        <p>{plan.body}</p>
        {!!plan.checklist?.length && <ul>{plan.checklist.map(line => <li key={line}><Check size={14}/>{line}</li>)}</ul>}
        <footer><button onClick={() => deleteLocalAiPlan(plan.id)}><Trash2 size={15}/>Eliminar</button></footer>
      </article>)}
      {!snapshot.savedPlans.length && <Card title="Planes guardados" icon="📌"><p className="muted">Cuando una respuesta te resulte útil, pulsa “Guardar plan”.</p></Card>}
    </div>}

    {tab === 'admin' && admin && <div className="aiAdminGrid">
      <Card title="Configuración local" icon="⚙️">
        <label className="aiSwitch"><span><b>Motor local</b><small>Mantiene respuestas disponibles sin servicios externos.</small></span><input type="checkbox" checked={settingsDraft.local_enabled} onChange={e => setSettingsDraft(s => ({ ...s, local_enabled: e.target.checked }))}/></label>
        <label className="aiSwitch"><span><b>Endpoint externo opcional</b><small>Solo funciona cuando VITE_AI_ENDPOINT está configurado.</small></span><input type="checkbox" checked={settingsDraft.external_endpoint_enabled} onChange={e => setSettingsDraft(s => ({ ...s, external_endpoint_enabled: e.target.checked }))}/></label>
        <label className="aiSwitch"><span><b>Permitir estudiantes</b><small>Se mantiene desactivado por seguridad.</small></span><input type="checkbox" checked={settingsDraft.allow_student_access} onChange={e => setSettingsDraft(s => ({ ...s, allow_student_access: e.target.checked }))}/></label>
        <label className="fieldLabel">Máximo de caracteres<input className="field" type="number" min="300" max="5000" value={settingsDraft.max_prompt_chars} onChange={e => setSettingsDraft(s => ({ ...s, max_prompt_chars: Number(e.target.value) }))}/></label>
        <button className="primary" onClick={saveSettings}><Settings2 size={16}/>Guardar configuración</button>
      </Card>
      <Card title="Métricas locales" icon="📊"><div className="aiAdminStats"><span><b>{snapshot.state.usage.length}</b> consultas</span><span><b>{snapshot.state.conversations.length}</b> conversaciones</span><span><b>{snapshot.state.saved_plans.length}</b> planes</span><span><b>{snapshot.state.feedback.length}</b> evaluaciones</span></div><p className="muted">Estas métricas pertenecen únicamente a este navegador.</p></Card>
      <Card title="Alertas de seguridad" icon="🚨"><div className="aiFlagList">{snapshot.flagged.map(flag => <div key={flag.id}><span><b>{localAiUserLabel(flag.user_id)}</b><small>{flag.prompt}</small><em>{flag.reason}</em></span><select value={flag.status} onChange={e => { reviewLocalAiFlag(flag.id, e.target.value); reload(); }}><option value="blocked">Bloqueado</option><option value="reviewed">Revisado</option><option value="dismissed">Descartado</option></select></div>)}{!snapshot.flagged.length && <p className="muted">No hay consultas bloqueadas.</p>}</div></Card>
      <Card title="Mantenimiento" icon="🧹"><p className="muted">Restablece solamente historial, planes y configuración de IA de este navegador.</p><button className="dangerButton" onClick={() => { if (confirm('¿Restablecer IA MiZona local?')) { resetLocalAi(); reload(); } }}><RotateCcw size={16}/>Restablecer IA local</button></Card>
    </div>}

    <div className="aiCapabilityGrid">
      <article><MessageSquareText/><b>Contexto local</b><p>Usa conteos y datos resumidos de los módulos del perfil activo.</p></article>
      <article><Clock3/><b>Historial separado</b><p>Cada perfil local conserva sus propias conversaciones y planes.</p></article>
      <article><ShieldAlert/><b>Privacidad y filtros</b><p>Bloquea consultas con contraseñas, datos bancarios o información privada de menores.</p></article>
    </div>
  </div>;
}
