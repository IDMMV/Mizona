import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck, Building2, ChevronRight, Filter, Heart, MapPin, MessageCircle,
  Search, ShieldCheck, Sparkles, Star, Store, TicketPercent, UserCheck, X
} from 'lucide-react';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { sendLocalContactRequest, startLocalDirectConversation } from '../lib/localStore';
import {
  createLocalBusiness, createLocalBusinessClaim, getLocalCommerceSnapshot,
  rateLocalBusiness, registerLocalBusinessContact, registerLocalBusinessView,
  reportLocalBusiness, subscribeLocalCommerce, toggleLocalBusinessFavorite,
  updateLocalBusiness
} from '../lib/localCommerce';

const categories = [
  { id:'all', label:'Todo', icon:'✨' }, { id:'food', label:'Comida', icon:'🍔' },
  { id:'health', label:'Salud', icon:'💊' }, { id:'home', label:'Hogar', icon:'🔧' },
  { id:'education', label:'Educación', icon:'📚' }, { id:'beauty', label:'Belleza', icon:'💇' },
  { id:'services', label:'Servicios', icon:'🧰' }
];
const businessEmoji = { food:'🍔', health:'💊', home:'🧱', education:'📘', beauty:'💇', services:'🧰' };
const emptyBusiness = { name:'', category:'food', zone:'Pachacútec', address:'', description:'', hours:'', offer_title:'', offer_detail:'', offer_price:'' };

function Stars({ value=0 }){ return <span className="stars"><Star size={14} fill="currentColor"/> {Number(value||0).toFixed(1)}</span>; }
function distanceLabel(value){ return Number(value)<1?`${Math.round(Number(value)*1000)} m`:`${Number(value).toFixed(1)} km`; }

function BusinessCard({ place, onOpen, onFavorite, favorite }){
  return <article className={`placeCard ${place.status!=='active'?'commerceInactive':''}`}>
    <div className="placeVisual"><span>{place.emoji}</span>{place.affiliated&&<b><BadgeCheck size={14}/> MiZona</b>}{place.is_mine&&<i className="mineBadge">Tu negocio</i>}</div>
    <div className="placeBody">
      {place.status!=='active'&&<span className={`publicationState ${place.status}`}>{place.status==='pending'?'Pendiente de revisión':place.status}</span>}
      <div className="placeTitle"><div><h3>{place.name}</h3><p>{place.description}</p></div><button className={`heartBtn ${favorite?'saved':''}`} onClick={()=>onFavorite(place.id)}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div>
      <div className="placeMeta"><Stars value={place.rating}/><span>{place.review_count} opiniones</span><span><MapPin size={14}/>{distanceLabel(place.distance_km)}</span><span className={place.open?'open':'closed'}>{place.open?'Abierto':'Cerrado'}</span></div>
      <div className="placeBadges">{(place.badges||[]).map(b=><span key={b}>{b}</span>)}</div>
      {place.offer_title&&<div className="miniOffer"><TicketPercent size={17}/><div><b>{place.offer_title}</b><span>{place.offer_detail}</span></div><strong>{place.offer_price}</strong></div>}
      <div className="placeActions"><button className="secondary" onClick={()=>onOpen(place)}>Ver detalles</button><button className="primary" onClick={()=>onOpen(place)}>Abrir perfil <ChevronRight size={16}/></button></div>
    </div>
  </article>;
}

export default function Businesses({ setPage }){
  const { profile } = useApp();
  const [snapshot,setSnapshot]=useState(getLocalCommerceSnapshot);
  const [category,setCategory]=useState('all'); const [query,setQuery]=useState('');
  const [onlyOpen,setOnlyOpen]=useState(false); const [onlyAffiliated,setOnlyAffiliated]=useState(false);
  const [sort,setSort]=useState('recommended'); const [selected,setSelected]=useState(null);
  const [showClaim,setShowClaim]=useState(null); const [showCreate,setShowCreate]=useState(false);
  const [businessForm,setBusinessForm]=useState(emptyBusiness); const [claimEvidence,setClaimEvidence]=useState('');
  const [rating,setRating]=useState(5); const [reviewComment,setReviewComment]=useState('');
  const [toast,setToast]=useState(''); const [error,setError]=useState('');

  useEffect(()=>subscribeLocalCommerce(setSnapshot),[]);
  const favoriteSet=useMemo(()=>new Set(snapshot.myBusinessFavoriteIds),[snapshot.myBusinessFavoriteIds]);
  const places=useMemo(()=>{
    let list=snapshot.businesses.filter(p=>category==='all'||p.category===category).filter(p=>!onlyOpen||p.open).filter(p=>!onlyAffiliated||p.affiliated).filter(p=>`${p.name} ${p.description} ${p.zone}`.toLowerCase().includes(query.toLowerCase()));
    return [...list].sort((a,b)=>sort==='distance'?a.distance_km-b.distance_km:sort==='rating'?b.rating-a.rating:(Number(b.affiliated)-Number(a.affiliated))||(b.rating-a.rating));
  },[snapshot.businesses,category,query,onlyOpen,onlyAffiliated,sort]);
  const myBusinesses=snapshot.businesses.filter(x=>x.owner_id===profile.id);
  const notify=text=>{setToast(text);setError('');setTimeout(()=>setToast(''),2600);};
  const fail=err=>{setError(err?.message||String(err));setTimeout(()=>setError(''),4200);};
  const openPlace=place=>{registerLocalBusinessView(place.id);setSelected({...place,views:Number(place.views||0)+1});};
  const favorite=id=>{try{toggleLocalBusinessFavorite(id);}catch(err){fail(err);}};
  const createBusiness=()=>{try{createLocalBusiness({...businessForm,emoji:businessEmoji[businessForm.category]||'🏪'});setShowCreate(false);setBusinessForm(emptyBusiness);notify('Negocio enviado. Un administrador local podrá aprobarlo.');}catch(err){fail(err);}};
  const claimBusiness=()=>{try{createLocalBusinessClaim(showClaim.id,claimEvidence);setShowClaim(null);setClaimEvidence('');notify('Solicitud de administración enviada.');}catch(err){fail(err);}};
  const saveRating=()=>{try{rateLocalBusiness(selected.id,rating,reviewComment);setReviewComment('');setSelected(getLocalCommerceSnapshot().businesses.find(x=>x.id===selected.id)||selected);notify('Tu opinión quedó guardada.');}catch(err){fail(err);}};
  const contactOwner=place=>{try{
    if(!place.owner_id) throw new Error('Este negocio todavía no tiene propietario verificado.');
    try{startLocalDirectConversation(place.owner_id);registerLocalBusinessContact(place.id);setSelected(null);setPage?.('chat');}
    catch(chatError){ if(String(chatError.message).includes('contactos')){sendLocalContactRequest(place.owner?.username||'');notify('Primero enviamos una solicitud de contacto al negocio.');} else throw chatError; }
  }catch(err){fail(err);}};
  const toggleOpen=place=>{try{updateLocalBusiness(place.id,{open:!place.open});setSelected({...place,open:!place.open});notify(place.open?'Negocio marcado como cerrado.':'Negocio marcado como abierto.');}catch(err){fail(err);}};

  return <div className="page businessPage commerceV17">
    <section className="businessHero"><div><p className="eyebrow">Directorio multiusuario local</p><h1>Negocios y lugares de tu zona</h1><p>Crea un negocio, reclama una ficha, administra horarios y recibe contactos dentro de MiZona Chat.</p></div><div className="businessHeroStats"><span><b>{snapshot.businesses.filter(x=>x.status==='active').length}</b> activos</span><span><b>{snapshot.businesses.filter(x=>x.affiliated).length}</b> afiliados</span><span><b>{snapshot.pendingClaimCount}</b> reclamos pendientes</span></div></section>

    <section className="businessSearchPanel"><div className="businessSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca comida, farmacia, electricista, colegio..."/></div><button className="secondary" onClick={()=>setShowCreate(true)}><Store size={17}/> Registrar negocio</button><button className="primary" onClick={()=>{const candidate=snapshot.businesses.find(x=>!x.owner_id);if(candidate)setShowClaim(candidate);else fail('No hay fichas sin propietario disponibles.');}}><UserCheck size={17}/> Reclamar negocio</button></section>
    <div className="categoryRail">{categories.map(c=><button key={c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}><span>{c.icon}</span>{c.label}</button>)}</div>
    <div className="businessToolbar"><div className="filterChecks"><label><input type="checkbox" checked={onlyOpen} onChange={e=>setOnlyOpen(e.target.checked)}/> Abierto ahora</label><label><input type="checkbox" checked={onlyAffiliated} onChange={e=>setOnlyAffiliated(e.target.checked)}/> Afiliado MiZona</label></div><div className="sortSelect"><Filter size={16}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recomendados</option><option value="distance">Más cercanos</option><option value="rating">Mejor calificados</option></select></div></div>

    <div className="businessLayout"><section><div className="sectionTitle"><div><h2>{places.length} resultados</h2><p>Los datos se comparten entre perfiles y pestañas del mismo navegador.</p></div></div><div className="placeGrid">{places.map(p=><BusinessCard key={p.id} place={p} onOpen={openPlace} onFavorite={favorite} favorite={favoriteSet.has(p.id)}/>)}</div>{!places.length&&<div className="emptyState">No encontramos resultados con esos filtros.</div>}</section>
      <aside className="businessSide"><Card title="Tus negocios" icon="🏪"><div className="commerceMiniList">{myBusinesses.length?myBusinesses.map(x=><button key={x.id} onClick={()=>openPlace(x)}><span>{x.emoji}</span><div><b>{x.name}</b><small>{x.status} · {x.open?'abierto':'cerrado'}</small></div></button>):<p className="muted">Todavía no administras un negocio.</p>}</div><button className="primary full" onClick={()=>setShowCreate(true)}>Crear perfil comercial</button></Card><Card title="Confianza local" icon="🛡️"><ul className="list compact"><li>Propietarios y fichas pasan por moderación.</li><li>El contacto ocurre dentro de MiZona Chat.</li><li>Opiniones y favoritos son independientes por usuario.</li><li>Los cambios quedan en auditoría local.</li></ul></Card></aside>
    </div>

    {selected&&<div className="modalBackdrop" onMouseDown={()=>setSelected(null)}><section className="businessModal commerceDetailModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}><X size={18}/></button><div className="businessModalHead"><div className="businessAvatar">{selected.emoji}</div><div><p className="eyebrow">{selected.affiliated?'Perfil afiliado':'Ficha comunitaria'}</p><h2>{selected.name}</h2><div className="placeMeta"><Stars value={selected.rating}/><span>{selected.review_count} opiniones</span><span className={selected.open?'open':'closed'}>{selected.open?'Abierto':'Cerrado'}</span></div></div></div><p className="marketDescription">{selected.description}</p><div className="modalFacts"><span><MapPin size={17}/><b>Dirección</b>{selected.address||selected.zone}</span><span><Building2 size={17}/><b>Horario</b>{selected.hours||'Por coordinar'}</span><span><ShieldCheck size={17}/><b>Estado</b>{selected.verified?'Propietario verificado':'Información comunitaria'}</span><span><Sparkles size={17}/><b>Actividad</b>{selected.views||0} vistas · {selected.contact_count||0} contactos</span></div>{selected.offer_title&&<div className="miniOffer"><TicketPercent size={18}/><div><b>{selected.offer_title}</b><span>{selected.offer_detail}</span></div><strong>{selected.offer_price}</strong></div>}
      <div className="commerceRating"><b>Califica este negocio</b><div><select value={rating} onChange={e=>setRating(Number(e.target.value))}><option value="5">5 estrellas</option><option value="4">4 estrellas</option><option value="3">3 estrellas</option><option value="2">2 estrellas</option><option value="1">1 estrella</option></select><input value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="Comentario opcional"/><button onClick={saveRating}>Guardar</button></div></div>
      <div className="modalActions">{!selected.owner_id&&<button className="secondary" onClick={()=>{setShowClaim(selected);setSelected(null);}}><UserCheck size={17}/> Reclamar</button>}<button className="secondary" onClick={()=>{reportLocalBusiness(selected.id,'Información incorrecta','Reporte desde el perfil del negocio');notify('Reporte enviado a moderación local.');}}><ShieldCheck size={17}/> Reportar</button>{selected.is_mine&&<button className="secondary" onClick={()=>toggleOpen(selected)}>{selected.open?'Cerrar ahora':'Abrir ahora'}</button>}<button className="primary" disabled={!selected.owner_id||selected.is_mine} onClick={()=>contactOwner(selected)}><MessageCircle size={17}/> Contactar por Chat</button></div></section></div>}

    {showCreate&&<div className="modalBackdrop" onMouseDown={()=>setShowCreate(false)}><section className="benefitCreateModal" onMouseDown={e=>e.stopPropagation()}><div className="benefitModalHead"><div><p className="eyebrow">Nuevo perfil comercial</p><h2>Registrar negocio</h2></div><button onClick={()=>setShowCreate(false)}><X size={18}/></button></div><div className="benefitFormGrid"><label>Nombre<input value={businessForm.name} onChange={e=>setBusinessForm({...businessForm,name:e.target.value})}/></label><label>Categoría<select value={businessForm.category} onChange={e=>setBusinessForm({...businessForm,category:e.target.value})}>{categories.filter(x=>x.id!=='all').map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label><label>Zona<input value={businessForm.zone} onChange={e=>setBusinessForm({...businessForm,zone:e.target.value})}/></label><label>Dirección<input value={businessForm.address} onChange={e=>setBusinessForm({...businessForm,address:e.target.value})}/></label><label className="wide">Descripción<textarea value={businessForm.description} onChange={e=>setBusinessForm({...businessForm,description:e.target.value})}/></label><label>Horario<input value={businessForm.hours} onChange={e=>setBusinessForm({...businessForm,hours:e.target.value})}/></label><label>Oferta inicial<input value={businessForm.offer_title} onChange={e=>setBusinessForm({...businessForm,offer_title:e.target.value})} placeholder="Opcional"/></label></div><div className="benefitFormActions"><button className="secondary" onClick={()=>setShowCreate(false)}>Cancelar</button><button className="primary" onClick={createBusiness}>Enviar a revisión</button></div></section></div>}

    {showClaim&&<div className="modalBackdrop" onMouseDown={()=>setShowClaim(null)}><section className="formModal commerceSmallModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setShowClaim(null)}><X size={18}/></button><h2>Reclamar {showClaim.name}</h2><p className="muted">Explica por qué eres el propietario o administrador responsable.</p><textarea className="field" value={claimEvidence} onChange={e=>setClaimEvidence(e.target.value)} placeholder="Ej. Soy propietario y puedo presentar licencia o recibos..."/><button className="primary wide" onClick={claimBusiness}>Enviar solicitud</button></section></div>}
    {toast&&<div className="toastSuccess"><Sparkles size={17}/>{toast}</div>}{error&&<div className="toastError">⚠️ {error}<button onClick={()=>setError('')}>×</button></div>}
  </div>;
}
