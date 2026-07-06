import { useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Check, Clock3, Gift, Heart, MapPin, Search, Sparkles, Stethoscope, Tag, Ticket, Users } from 'lucide-react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';

const categories = [
  { id:'all', label:'Todo', icon:'✨' },
  { id:'offers', label:'Ofertas', icon:'🏷️' },
  { id:'jobs', label:'Empleos', icon:'💼' },
  { id:'events', label:'Eventos', icon:'🎉' },
  { id:'campaigns', label:'Campañas', icon:'❤️' },
  { id:'coupons', label:'Cupones', icon:'🎟️' }
];

const items = [
  { id:'off-1', type:'offers', title:'Combo familiar de pollo', owner:'Pollería El Buen Sabor', zone:'Pachacútec', distance:'650 m', badge:'35% menos', price:'S/ 49.90', previous:'S/ 76.00', expires:'Hoy, 9:00 p. m.', image:'🍗', verified:true, action:'Ver oferta', description:'1 pollo, papas, ensalada y gaseosa de 1.5 L. Stock limitado a 25 combos.' },
  { id:'off-2', type:'offers', title:'Balón de gas con reparto', owner:'Gas Ventanilla', zone:'Ventanilla', distance:'1.2 km', badge:'Ahorra S/ 8', price:'S/ 46.00', previous:'S/ 54.00', expires:'Hasta mañana', image:'🔥', verified:true, action:'Solicitar', description:'Precio final con reparto en sectores habilitados. Confirma cobertura antes de pagar.' },
  { id:'job-1', type:'jobs', title:'Auxiliar de caja', owner:'Mercado Central Pachacútec', zone:'Pachacútec', distance:'900 m', badge:'Tiempo completo', price:'S/ 1,350', previous:null, expires:'Postula hasta viernes', image:'🧾', verified:true, action:'Postular', description:'Se requiere disponibilidad inmediata. Experiencia deseable, no indispensable.' },
  { id:'job-2', type:'jobs', title:'Repartidor por horas', owner:'Chifa Nuevo Oriente', zone:'Ventanilla', distance:'2.4 km', badge:'Medio tiempo', price:'Pago diario', previous:null, expires:'3 vacantes', image:'🛵', verified:false, action:'Postular', description:'Turno noche. Requiere bicicleta o moto y disponibilidad de 6:00 p. m. a 10:00 p. m.' },
  { id:'event-1', type:'events', title:'Feria escolar y científica', owner:'Colegio San Martín', zone:'Pachacútec', distance:'1.1 km', badge:'Entrada libre', price:'Sábado 10:00 a. m.', previous:null, expires:'Faltan 3 días', image:'🔬', verified:true, action:'Asistiré', description:'Exposición de proyectos, concursos, gastronomía y actividades familiares.' },
  { id:'event-2', type:'events', title:'Campeonato relámpago', owner:'Club Deportivo Unión', zone:'Ventanilla', distance:'2.8 km', badge:'Inscripción abierta', price:'S/ 20 por equipo', previous:null, expires:'Domingo', image:'⚽', verified:true, action:'Inscribirme', description:'Categorías juvenil y libre. Incluye arbitraje y premiación.' },
  { id:'campaign-1', type:'campaigns', title:'Campaña médica gratuita', owner:'Centro de Salud Pachacútec', zone:'Pachacútec', distance:'700 m', badge:'Gratis', price:'Medicina general', previous:null, expires:'Jueves 8:00 a. m.', image:'🩺', verified:true, action:'Reservar turno', description:'Atención general, descarte de anemia y orientación nutricional. Cupos limitados.' },
  { id:'campaign-2', type:'campaigns', title:'Donación de útiles escolares', owner:'Comité Los Pinos', zone:'Sector B', distance:'1.7 km', badge:'Solidaria', price:'Hasta el 25 de julio', previous:null, expires:'10 días', image:'🎒', verified:true, action:'Quiero ayudar', description:'Recibimos cuadernos, colores, mochilas y libros en buen estado.' },
  { id:'coupon-1', type:'coupons', title:'2x1 en entradas infantiles', owner:'Cine Plaza Ventanilla', zone:'Ventanilla', distance:'4.1 km', badge:'Cupón MiZona', price:'2x1', previous:null, expires:'Lunes a jueves', image:'🎬', verified:true, action:'Obtener cupón', description:'Válido para funciones 2D antes de las 6:00 p. m. No acumulable.' },
  { id:'coupon-2', type:'coupons', title:'Primera clase de gimnasio', owner:'Energía Fitness', zone:'Pachacútec', distance:'1.5 km', badge:'Gratis', price:'S/ 0.00', previous:'S/ 15.00', expires:'7 días', image:'🏋️', verified:false, action:'Activar beneficio', description:'Incluye evaluación básica y acceso a una clase grupal.' }
];

const iconByType = { offers:Tag, jobs:BriefcaseBusiness, events:CalendarDays, campaigns:Heart, coupons:Ticket };

export default function Benefits(){
  const [active,setActive]=useState('all');
  const [query,setQuery]=useState('');
  const [saved,setSaved]=useState(['off-1','coupon-1']);
  const [selected,setSelected]=useState(null);
  const [notice,setNotice]=useState('');

  const filtered=useMemo(()=>items.filter(item=>{
    const matchesType=active==='all'||item.type===active;
    const q=query.trim().toLowerCase();
    const matchesQuery=!q||`${item.title} ${item.owner} ${item.zone} ${item.description}`.toLowerCase().includes(q);
    return matchesType&&matchesQuery;
  }),[active,query]);

  const toggleSaved=id=>setSaved(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const act=item=>{
    setNotice(`${item.action}: solicitud registrada en el prototipo.`);
    window.setTimeout(()=>setNotice(''),2600);
  };

  return <div className="page benefitsPage">
    <section className="benefitsHero">
      <div>
        <p className="eyebrow">Radar de oportunidades</p>
        <h1>Ahorra y encuentra oportunidades cerca de ti</h1>
        <p>Ofertas, empleos, eventos, campañas y cupones de Ventanilla–Pachacútec.</p>
        <div className="benefitSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca pollo, empleo, campaña médica, cine..." /></div>
      </div>
      <div className="savingBox"><Sparkles size={24}/><b>S/ 87</b><span>ahorro potencial detectado hoy</span></div>
    </section>

    <div className="benefitStats">
      <span><Gift size={18}/> 12 ofertas nuevas</span>
      <span><BriefcaseBusiness size={18}/> 5 empleos cerca</span>
      <span><CalendarDays size={18}/> 3 eventos esta semana</span>
      <span><Heart size={18}/> 2 campañas activas</span>
    </div>

    <Tabs tabs={categories} active={active} setActive={setActive}/>

    <div className="benefitToolbar">
      <p><b>{filtered.length}</b> oportunidades encontradas</p>
      <button className="ghost" onClick={()=>setActive('all')}>Limpiar filtros</button>
    </div>

    <div className="opportunityGrid">
      {filtered.map(item=>{
        const TypeIcon=iconByType[item.type]||Gift;
        return <article className="opportunityCard" key={item.id}>
          <button className={`saveBtn ${saved.includes(item.id)?'saved':''}`} onClick={()=>toggleSaved(item.id)} aria-label="Guardar"><Heart size={18} fill={saved.includes(item.id)?'currentColor':'none'}/></button>
          <div className="opportunityVisual"><span>{item.image}</span><i>{item.badge}</i></div>
          <div className="opportunityBody">
            <div className="opportunityType"><TypeIcon size={15}/>{categories.find(c=>c.id===item.type)?.label}{item.verified&&<em><Check size={12}/> Verificado</em>}</div>
            <h3>{item.title}</h3>
            <p className="ownerName">{item.owner}</p>
            <p className="locationLine"><MapPin size={15}/>{item.zone} · {item.distance}</p>
            <div className="priceLine"><b>{item.price}</b>{item.previous&&<del>{item.previous}</del>}</div>
            <p className="expiry"><Clock3 size={14}/>{item.expires}</p>
            <div className="cardActions"><button className="primary" onClick={()=>act(item)}>{item.action}</button><button className="ghost" onClick={()=>setSelected(item)}>Detalles</button></div>
          </div>
        </article>;
      })}
    </div>

    {!filtered.length&&<div className="emptyState"><Search size={38}/><h3>No encontramos coincidencias</h3><p>Prueba con otra palabra o muestra todas las categorías.</p></div>}

    <div className="grid2 benefitBottom">
      <Card title="Mis guardados" icon="⭐"><div className="savedList">{items.filter(x=>saved.includes(x.id)).map(x=><button key={x.id} onClick={()=>setSelected(x)}><span>{x.image}</span><div><b>{x.title}</b><small>{x.owner}</small></div></button>)}</div></Card>
      <Card title="Comparte una oportunidad" icon="📣"><p className="muted">Ayuda a otra persona enviando una oferta, empleo, evento o campaña útil.</p><div className="shareButtons"><button>WhatsApp</button><button>Facebook</button><button>Copiar enlace</button></div></Card>
    </div>

    {selected&&<div className="modalBackdrop" onClick={()=>setSelected(null)}><div className="detailModal" onClick={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}>×</button><div className="detailIcon">{selected.image}</div><p className="eyebrow">{selected.badge}</p><h2>{selected.title}</h2><p>{selected.description}</p><div className="detailFacts"><span><Users size={16}/>{selected.owner}</span><span><MapPin size={16}/>{selected.zone} · {selected.distance}</span><span><Clock3 size={16}/>{selected.expires}</span></div><button className="primary full" onClick={()=>act(selected)}>{selected.action}</button></div></div>}
    {notice&&<div className="toastSuccess"><Check size={17}/>{notice}</div>}
  </div>;
}
