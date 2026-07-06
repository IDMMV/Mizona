import { useMemo, useState } from 'react';
import {
  BadgeCheck, Building2, ChevronRight, Clock3, Filter, Heart, MapPin,
  Navigation, Phone, Search, Share2, ShieldCheck, Sparkles, Star, Store,
  Tag, TicketPercent, UserCheck, X
} from 'lucide-react';
import Card from '../components/Card';

const categories = [
  { id:'all', label:'Todo', icon:'✨' },
  { id:'food', label:'Comida', icon:'🍔' },
  { id:'health', label:'Salud', icon:'💊' },
  { id:'home', label:'Hogar', icon:'🔧' },
  { id:'education', label:'Educación', icon:'📚' },
  { id:'beauty', label:'Belleza', icon:'💇' },
  { id:'services', label:'Servicios', icon:'🧰' }
];

const placesSeed = [
  {
    id:'lolita-burger', category:'food', name:'Lolita Burger', emoji:'🍔', zone:'Pachacútec',
    distance:'320 m', rating:4.7, reviews:128, open:true, affiliated:false, verified:false,
    description:'Hamburguesas artesanales, salchipapas y combos familiares.',
    address:'Av. 225, Pachacútec', phone:'No disponible', hours:'4:00 p. m. – 11:30 p. m.',
    badges:['Muy recomendado'], offers:[], source:'Información pública y aportes de vecinos'
  },
  {
    id:'buen-sabor', category:'food', name:'Pollería El Buen Sabor', emoji:'🍗', zone:'Pachacútec',
    distance:'650 m', rating:4.8, reviews:246, open:true, affiliated:true, verified:true,
    description:'Pollo a la brasa, parrillas, delivery y promociones para familias.',
    address:'Mz. H Lt. 12, Pachacútec', phone:'01 555 0198', hours:'12:00 p. m. – 11:00 p. m.',
    badges:['Afiliado MiZona','Cupón activo'], offers:[{title:'Combo familiar',detail:'1 pollo + papas + ensalada + gaseosa',price:'S/ 49.90'}], source:'Perfil administrado por el negocio'
  },
  {
    id:'farmacia-economica', category:'health', name:'Farmacia Económica', emoji:'💊', zone:'Ventanilla',
    distance:'1.1 km', rating:4.6, reviews:89, open:true, affiliated:true, verified:true,
    description:'Medicamentos, cuidado personal y orientación farmacéutica.',
    address:'Av. Néstor Gambetta 580', phone:'01 555 0132', hours:'24 horas',
    badges:['24 horas','Afiliado MiZona'], offers:[{title:'Cuidado infantil',detail:'15% en productos seleccionados',price:'15% OFF'}], source:'Perfil administrado por el negocio'
  },
  {
    id:'ferreteria-carlos', category:'home', name:'Ferretería Don Carlos', emoji:'🧱', zone:'Pachacútec',
    distance:'780 m', rating:4.8, reviews:152, open:true, affiliated:false, verified:false,
    description:'Herramientas, conexiones eléctricas, pinturas y materiales.',
    address:'Mercado Pachacútec, puesto 42', phone:'No disponible', hours:'8:00 a. m. – 7:00 p. m.',
    badges:['Recomendado por vecinos'], offers:[], source:'Información pública y aportes de vecinos'
  },
  {
    id:'academia-futuro', category:'education', name:'Academia Futuro', emoji:'📘', zone:'Ventanilla',
    distance:'1.6 km', rating:4.5, reviews:64, open:false, affiliated:true, verified:true,
    description:'Reforzamiento escolar, preparación universitaria e inglés.',
    address:'Av. La Playa 225', phone:'01 555 0177', hours:'8:00 a. m. – 8:00 p. m.',
    badges:['Matrícula abierta'], offers:[{title:'Matrícula',detail:'Primera semana de prueba',price:'Gratis'}], source:'Perfil administrado por el negocio'
  },
  {
    id:'salon-luz', category:'beauty', name:'Salón Luz', emoji:'💇', zone:'Pachacútec',
    distance:'460 m', rating:4.4, reviews:53, open:true, affiliated:false, verified:false,
    description:'Cortes, peinados, manicure y tratamientos capilares.',
    address:'Sector C, Pachacútec', phone:'No disponible', hours:'9:00 a. m. – 8:00 p. m.',
    badges:[], offers:[], source:'Información pública y aportes de vecinos'
  },
  {
    id:'electro-soluciones', category:'services', name:'Electro Soluciones Miguel', emoji:'⚡', zone:'Ventanilla',
    distance:'2.2 km', rating:4.9, reviews:71, open:true, affiliated:true, verified:true,
    description:'Instalaciones eléctricas, mantenimiento y emergencias domiciliarias.',
    address:'Atención a domicilio', phone:'999 222 418', hours:'7:00 a. m. – 9:00 p. m.',
    badges:['Técnico verificado','Disponible hoy'], offers:[{title:'Diagnóstico',detail:'Visita técnica en Pachacútec',price:'Desde S/ 25'}], source:'Perfil profesional verificado'
  }
];

function Stars({ value }){
  return <span className="stars"><Star size={14} fill="currentColor"/> {value.toFixed(1)}</span>;
}

function BusinessCard({ place, onOpen, onFavorite, favorite }){
  return <article className="placeCard">
    <div className="placeVisual"><span>{place.emoji}</span>{place.affiliated&&<b><BadgeCheck size={14}/> MiZona</b>}</div>
    <div className="placeBody">
      <div className="placeTitle"><div><h3>{place.name}</h3><p>{place.description}</p></div><button className={`heartBtn ${favorite?'saved':''}`} onClick={()=>onFavorite(place.id)} aria-label="Guardar"><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div>
      <div className="placeMeta"><Stars value={place.rating}/><span>{place.reviews} opiniones</span><span><MapPin size={14}/>{place.distance}</span><span className={place.open?'open':'closed'}>{place.open?'Abierto':'Cerrado'}</span></div>
      <div className="placeBadges">{place.badges.map(b=><span key={b}>{b}</span>)}</div>
      {place.offers[0]&&<div className="miniOffer"><TicketPercent size={17}/><div><b>{place.offers[0].title}</b><span>{place.offers[0].detail}</span></div><strong>{place.offers[0].price}</strong></div>}
      <div className="placeActions"><button className="secondary" onClick={()=>onOpen(place)}>Ver detalles</button><button className="primary" onClick={()=>onOpen(place)}>Abrir perfil <ChevronRight size={16}/></button></div>
    </div>
  </article>;
}

export default function Businesses(){
  const [category,setCategory]=useState('all');
  const [query,setQuery]=useState('');
  const [onlyOpen,setOnlyOpen]=useState(false);
  const [onlyAffiliated,setOnlyAffiliated]=useState(false);
  const [sort,setSort]=useState('recommended');
  const [selected,setSelected]=useState(null);
  const [favorites,setFavorites]=useState(new Set());
  const [showClaim,setShowClaim]=useState(false);
  const [showSuggest,setShowSuggest]=useState(false);
  const [toast,setToast]=useState('');

  const places=useMemo(()=>{
    let list=placesSeed.filter(p=>category==='all'||p.category===category)
      .filter(p=>!onlyOpen||p.open)
      .filter(p=>!onlyAffiliated||p.affiliated)
      .filter(p=>`${p.name} ${p.description} ${p.zone}`.toLowerCase().includes(query.toLowerCase()));
    list=[...list].sort((a,b)=>sort==='distance'?parseFloat(a.distance)-parseFloat(b.distance):sort==='rating'?b.rating-a.rating:(Number(b.affiliated)-Number(a.affiliated))||(b.rating-a.rating));
    return list;
  },[category,query,onlyOpen,onlyAffiliated,sort]);

  const toggleFavorite=id=>setFavorites(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next;});
  const notify=text=>{setToast(text);setTimeout(()=>setToast(''),2400)};

  return <div className="page businessPage">
    <section className="businessHero">
      <div><p className="eyebrow">Todo lo que existe cerca de ti</p><h1>Negocios y lugares de tu zona</h1><p>Encuentra opciones afiliadas y no afiliadas. MiZona destaca dónde ahorras, qué recomienda tu comunidad y qué está abierto hoy.</p></div>
      <div className="businessHeroStats"><span><b>248</b> lugares registrados</span><span><b>36</b> perfiles afiliados</span><span><b>18</b> beneficios activos</span></div>
    </section>

    <section className="businessSearchPanel">
      <div className="businessSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca hamburguesas, farmacia, electricista, colegio..."/></div>
      <button className="secondary" onClick={()=>setShowSuggest(true)}><Store size={17}/> Agregar un lugar</button>
      <button className="primary" onClick={()=>setShowClaim(true)}><UserCheck size={17}/> Reclamar mi negocio</button>
    </section>

    <div className="categoryRail">{categories.map(c=><button key={c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}><span>{c.icon}</span>{c.label}</button>)}</div>

    <div className="businessToolbar">
      <div className="filterChecks"><label><input type="checkbox" checked={onlyOpen} onChange={e=>setOnlyOpen(e.target.checked)}/> Abierto ahora</label><label><input type="checkbox" checked={onlyAffiliated} onChange={e=>setOnlyAffiliated(e.target.checked)}/> Afiliado MiZona</label></div>
      <div className="sortSelect"><Filter size={16}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recomendados</option><option value="distance">Más cercanos</option><option value="rating">Mejor calificados</option></select></div>
    </div>

    <div className="businessLayout">
      <section><div className="sectionTitle"><div><h2>{places.length} resultados</h2><p>Los afiliados tienen promociones y atención directa; los demás siguen apareciendo con información básica.</p></div></div><div className="placeGrid">{places.map(p=><BusinessCard key={p.id} place={p} onOpen={setSelected} onFavorite={toggleFavorite} favorite={favorites.has(p.id)}/>)}</div>{places.length===0&&<div className="emptyState">No encontramos resultados con esos filtros.</div>}</section>
      <aside className="businessSide">
        <Card title="¿Por qué MiZona?" icon="✨"><ul className="list compact"><li>Todos los lugares pueden aparecer.</li><li>Los afiliados desbloquean promociones y chat.</li><li>Las recomendaciones priorizan confianza local.</li><li>Los resultados pueden medirse con QR y cupones.</li></ul></Card>
        <Card title="Más buscado hoy" icon="🔥"><div className="trendList"><span><b>1.</b> Pollo a la brasa <em>+22%</em></span><span><b>2.</b> Farmacia abierta <em>+18%</em></span><span><b>3.</b> Electricista <em>+15%</em></span><span><b>4.</b> Menú económico <em>+12%</em></span></div></Card>
        <Card title="Tus favoritos" icon="❤️"><p className="muted">{favorites.size?`Guardaste ${favorites.size} lugar${favorites.size>1?'es':''}.`:'Aún no guardaste lugares.'}</p></Card>
      </aside>
    </div>

    {selected&&<div className="modalBackdrop" onMouseDown={()=>setSelected(null)}><section className="businessModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}><X size={18}/></button><div className="businessModalTop"><span className="modalEmoji">{selected.emoji}</span><div><div className="modalTitleRow"><h2>{selected.name}</h2>{selected.verified&&<BadgeCheck size={20}/>}</div><p>{selected.description}</p><div className="placeMeta"><Stars value={selected.rating}/><span>{selected.reviews} opiniones</span><span className={selected.open?'open':'closed'}>{selected.open?'Abierto':'Cerrado'}</span></div></div></div><div className="modalFacts"><span><MapPin size={17}/><b>Dirección</b>{selected.address}</span><span><Clock3 size={17}/><b>Horario</b>{selected.hours}</span><span><Phone size={17}/><b>Contacto</b>{selected.phone}</span><span><ShieldCheck size={17}/><b>Fuente</b>{selected.source}</span></div>{selected.offers.length>0&&<div className="modalOffer"><Tag size={20}/><div><b>{selected.offers[0].title}</b><span>{selected.offers[0].detail}</span></div><strong>{selected.offers[0].price}</strong></div>}<div className="modalActions"><button className="secondary" onClick={()=>notify('Enlace copiado para compartir')}><Share2 size={17}/> Compartir</button><button className="secondary" onClick={()=>notify('Ruta preparada para abrir en mapas')}><Navigation size={17}/> Cómo llegar</button>{selected.affiliated?<button className="primary" onClick={()=>notify('Solicitud de contacto registrada')}><Phone size={17}/> Contactar</button>:<button className="primary" onClick={()=>{setSelected(null);setShowClaim(true)}}><UserCheck size={17}/> Soy el dueño</button>}</div></section></div>}

    {showClaim&&<div className="modalBackdrop" onMouseDown={()=>setShowClaim(false)}><section className="formModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setShowClaim(false)}><X size={18}/></button><h2>Reclamar un negocio</h2><p className="muted">El administrador revisará que tengas relación con el negocio antes de darte acceso.</p><label>Nombre del negocio<input placeholder="Ej. Lolita Burger"/></label><label>Tu nombre<input placeholder="Nombre completo"/></label><label>Documento o prueba de relación<input type="file"/></label><label>Mensaje<textarea placeholder="Explica brevemente tu relación con el negocio"/></label><button className="primary wide" onClick={()=>{setShowClaim(false);notify('Solicitud enviada para revisión')}}>Enviar solicitud</button></section></div>}

    {showSuggest&&<div className="modalBackdrop" onMouseDown={()=>setShowSuggest(false)}><section className="formModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setShowSuggest(false)}><X size={18}/></button><h2>Agregar un lugar que falta</h2><p className="muted">Tu aporte pasará por revisión antes de publicarse.</p><label>Nombre<input placeholder="Nombre del lugar"/></label><label>Categoría<select><option>Comida</option><option>Salud</option><option>Hogar</option><option>Educación</option><option>Servicios</option></select></label><label>Dirección<input placeholder="Dirección o referencia"/></label><label>Foto opcional<input type="file" accept="image/*"/></label><button className="primary wide" onClick={()=>{setShowSuggest(false);notify('Lugar enviado para revisión')}}>Enviar para revisión</button></section></div>}

    {toast&&<div className="toastSuccess"><Sparkles size={17}/>{toast}</div>}
  </div>;
}
