import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck, Bookmark, BookmarkCheck, BriefcaseBusiness, ChevronRight, Clock3,
  Flag, Grid2X2, Headphones, Heart, HelpCircle, Home, MapPin, MessageCircle,
  Package, PackageCheck, Search, ShieldCheck, ShoppingBag, Sparkles, Star,
  Store, Tag, TicketPercent, Truck, UserRound, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendLocalContactRequest, startLocalDirectConversation } from '../lib/localStore';
import {
  createLocalListing, getLocalCommerceSnapshot, registerLocalBusinessContact,
  registerLocalBusinessView, registerLocalListingContact, registerLocalListingView,
  reportLocalBusiness, reportLocalListing, subscribeLocalCommerce,
  toggleLocalBusinessFavorite, toggleLocalListingFavorite, updateLocalListingStatus
} from '../lib/localCommerce';

const categories = [
  { id:'all', label:'Todo', icon:'✨' },
  { id:'food', label:'Restaurantes', icon:'🍗' },
  { id:'home', label:'Hogar', icon:'🏠' },
  { id:'tech', label:'Tecnología', icon:'📱' },
  { id:'school', label:'Escolar', icon:'🎒' },
  { id:'fashion', label:'Ropa', icon:'👕' },
  { id:'kids', label:'Niños', icon:'🧸' },
  { id:'services', label:'Servicios', icon:'🛠️' },
  { id:'health', label:'Salud', icon:'💊' },
  { id:'education', label:'Educación', icon:'🎓' }
];
const listingCategoryEmoji = { home:'🏠', tech:'📱', school:'🎒', fashion:'👕', kids:'🧸', services:'🧰', food:'🍗', health:'💊', education:'🎓' };
const emptyForm = { title:'', category:'home', price:'', condition:'Nuevo', zone:'Pachacútec', description:'', delivery:false, negotiable:false, image_data:null, image:'📦' };
const promoSeeds = [
  { id:'promo-1', business:'Pollería El Buen Sabor', emoji:'🍗', title:'Combo familiar MiZona', discount:'-30%', price:'S/ 49.90', old:'S/ 69.90', category:'Restaurantes', expires:'Válido hasta domingo' },
  { id:'promo-2', business:'Farmacia Económica', emoji:'💊', title:'Cuidado infantil', discount:'-15%', price:'15% OFF', old:'', category:'Salud', expires:'Productos seleccionados' },
  { id:'promo-3', business:'Electro Soluciones Miguel', emoji:'⚡', title:'Diagnóstico eléctrico', discount:'Desde', price:'S/ 25', old:'', category:'Servicios', expires:'Atención hoy' }
];
function distanceLabel(value){ return Number(value) < 1 ? `${Math.round(Number(value)*1000)} m` : `${Number(value).toFixed(1)} km`; }
function timeLabel(value){ const ms=Date.now()-new Date(value).getTime(); if(ms<3600000)return `Hace ${Math.max(1,Math.round(ms/60000))} min`; if(ms<86400000)return `Hace ${Math.round(ms/3600000)} h`; return `Hace ${Math.round(ms/86400000)} días`; }
function money(value){ return `S/ ${Number(value||0).toFixed(2)}`; }

function SectionTitle({title, action, onAction}){
  return <div className="mkCSectionTitle"><h2>{title}</h2>{action&&<button onClick={onAction}>{action}</button>}</div>;
}
function BottomNav({active,setActive}){
  const items=[['home','Inicio',Home],['categories','Categorías',Grid2X2],['sell','Vender',ShoppingBag],['orders','Pedidos',Package],['help','Ayuda',Headphones]];
  return <nav className="mkCBottomNav">{items.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>;
}
function CategoryChips({category,setCategory}){
  return <div className="mkCCategoryChips">{categories.map(cat=><button key={cat.id} className={category===cat.id?'active':''} onClick={()=>setCategory(cat.id)}><span>{cat.icon}</span>{cat.label}</button>)}</div>;
}
function BusinessCard({biz,onOpen,favorite,onFavorite}){
  return <article className="mkCBusinessCard" onClick={()=>onOpen(biz)}>
    <div className="mkCBizLogo"><span>{biz.emoji}</span>{biz.verified&&<i><BadgeCheck size={14}/></i>}</div>
    <div><h3>{biz.name}</h3><p>{biz.category==='food'?'Restaurante':biz.category==='services'?'Servicio local':biz.category==='health'?'Salud':biz.category==='education'?'Educación':'Negocio local'}</p><div className="mkCStars"><Star size={13} fill="currentColor"/> {Number(biz.rating||0).toFixed(1)} · {distanceLabel(biz.distance_km)}</div></div>
    <button className="mkCFav" onClick={(e)=>{e.stopPropagation();onFavorite(biz.id);}}>{favorite?<BookmarkCheck size={17}/>:<Bookmark size={17}/>}</button>
  </article>;
}
function ListingCard({item,onOpen,onFavorite,favorite}){
  return <article className={`mkCProductCard ${item.status!=='active'?'commerceInactive':''}`}>
    <button className="mkCFav floating" onClick={()=>onFavorite(item.id)}>{favorite?<Heart size={18} fill="currentColor"/>:<Heart size={18}/>}</button>
    <div className="mkCProductVisual">{item.image_data?<img src={item.image_data} alt=""/>:<span>{item.image}</span>}<b>{item.condition}</b></div>
    <div className="mkCProductBody"><h3>{item.title}</h3><strong>{money(item.price)}</strong><p><UserRound size={14}/>@{item.seller_username}{item.verified&&<BadgeCheck size={14}/>}</p><small><MapPin size={13}/>{item.zone} · {distanceLabel(item.distance_km)} · {timeLabel(item.created_at)}</small><button onClick={()=>onOpen(item)}>Ver detalle</button></div>
  </article>;
}
function PromoCard({promo,onOpen}){
  return <article className="mkCPromoCard"><div className="mkCPromoVisual"><span>{promo.emoji}</span><b>{promo.discount}</b></div><div><p>{promo.business}</p><h3>{promo.title}</h3><strong>{promo.price}</strong>{promo.old&&<em>{promo.old}</em>}<small>{promo.expires}</small><button onClick={onOpen}>Ver beneficio</button></div></article>;
}

export default function Marketplace({ setPage }){
  const { profile } = useApp();
  const [snapshot,setSnapshot]=useState(getLocalCommerceSnapshot);
  const [tab,setTab]=useState('home');
  const [marketTab,setMarketTab]=useState('products');
  const [category,setCategory]=useState('all');
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState('recent');
  const [onlyVerified,setOnlyVerified]=useState(false);
  const [selected,setSelected]=useState(null);
  const [selectedBusiness,setSelectedBusiness]=useState(null);
  const [showPublish,setShowPublish]=useState(false);
  const [form,setForm]=useState(emptyForm);
  const [toast,setToast]=useState('');
  const [error,setError]=useState('');
  const sectionRefs = useRef({});
  useEffect(()=>subscribeLocalCommerce(setSnapshot),[]);
  const goMarketBlock = (target) => {
    setTab('home');
    setMarketTab(target);
    window.setTimeout(() => {
      sectionRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 90);
  };

  const favoriteListings=useMemo(()=>new Set(snapshot.myListingFavoriteIds),[snapshot.myListingFavoriteIds]);
  const favoriteBusinesses=useMemo(()=>new Set(snapshot.myBusinessFavoriteIds),[snapshot.myBusinessFavoriteIds]);
  const normalizedQuery=query.trim().toLowerCase();
  const listings=useMemo(()=>{
    let list=snapshot.listings
      .filter(x=>category==='all'||x.category===category)
      .filter(x=>!onlyVerified||x.verified)
      .filter(x=>`${x.title} ${x.description} ${x.seller_username} ${x.zone}`.toLowerCase().includes(normalizedQuery));
    return [...list].sort((a,b)=>sort==='priceLow'?a.price-b.price:sort==='priceHigh'?b.price-a.price:sort==='distance'?a.distance_km-b.distance_km:new Date(b.created_at)-new Date(a.created_at));
  },[snapshot.listings,category,onlyVerified,normalizedQuery,sort]);
  const businesses=useMemo(()=>snapshot.businesses
    .filter(b=>!onlyVerified||b.verified)
    .filter(b=>`${b.name} ${b.description} ${b.zone} ${b.category}`.toLowerCase().includes(normalizedQuery))
    .sort((a,b)=>a.distance_km-b.distance_km),[snapshot.businesses,onlyVerified,normalizedQuery]);
  const services=listings.filter(x=>x.category==='services'||x.condition==='Servicio');
  const nearListings=listings.slice(0,6);
  const verifiedBusinesses=businesses.filter(b=>b.verified).slice(0,6);
  const myListings=snapshot.listings.filter(x=>x.seller_id===profile.id);
  const notify=t=>{setToast(t);setError('');setTimeout(()=>setToast(''),2500);};
  const fail=e=>{setError(e?.message||String(e));setTimeout(()=>setError(''),4200);};
  const openListing=item=>{registerLocalListingView(item.id);setSelected({...item,views:Number(item.views||0)+1});};
  const openBusiness=biz=>{registerLocalBusinessView(biz.id);setSelectedBusiness({...biz,views:Number(biz.views||0)+1});};
  const publish=()=>{try{createLocalListing({...form,image:form.image||listingCategoryEmoji[form.category]||'📦'});setShowPublish(false);setForm(emptyForm);notify('Publicación enviada correctamente.');}catch(e){fail(e);}};
  const contactSeller=item=>{try{if(item.seller_id===profile.id)throw new Error('Esta publicación es tuya.');try{startLocalDirectConversation(item.seller_id);registerLocalListingContact(item.id);setSelected(null);setPage?.('chat');}catch(chatError){if(String(chatError.message).includes('contactos')){sendLocalContactRequest(item.seller_username);notify('Enviamos solicitud de contacto al vendedor.');}else throw chatError;}}catch(e){fail(e);}};
  const contactBusiness=biz=>{try{if(!biz.owner_id)throw new Error('Este negocio todavía no tiene propietario en MiZona.');startLocalDirectConversation(biz.owner_id);registerLocalBusinessContact(biz.id);setSelectedBusiness(null);setPage?.('chat');}catch(e){fail(e);}};
  const chooseImage=event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>1200000){fail('La imagen debe pesar menos de 1.2 MB.');event.target.value='';return;}const reader=new FileReader();reader.onload=()=>setForm(current=>({...current,image_data:String(reader.result),image:'🖼️'}));reader.onerror=()=>fail('No se pudo leer la imagen.');reader.readAsDataURL(file);};
  const setStatus=(id,status)=>{try{updateLocalListingStatus(id,status);setSelected(null);notify(status==='sold'?'Publicación marcada como vendida.':`Estado actualizado: ${status}.`);}catch(e){fail(e);}};

  return <div className="page marketplacePage marketplaceC23">
    {tab==='home'&&<>
      <section className="mkCTopHero">
        <div className="mkCHeroHead"><div><p className="eyebrow">Marketplace + Promos + Comunidad</p><h1>Todo lo que tu zona necesita, en un solo lugar</h1><p>Compra, vende, encuentra servicios, guarda beneficios y conversa con negocios verificados de tu comunidad.</p></div><button onClick={()=>setShowPublish(true)}><ShoppingBag size={18}/> Vender</button></div>
        <div className="mkCSearchRow"><div className="mkCSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca productos, servicios, negocios o promos..."/></div><button className="mkCLocation"><MapPin size={18}/> {profile?.zone||'Ventanilla'}</button></div>
        <div className="mkCModeTabs"><button className={marketTab==='products'?'active':''} onClick={()=>goMarketBlock('products')}><ShoppingBag size={17}/>Productos</button><button className={marketTab==='services'?'active':''} onClick={()=>goMarketBlock('services')}><BriefcaseBusiness size={17}/>Servicios</button><button className={marketTab==='community'?'active':''} onClick={()=>goMarketBlock('community')}><Store size={17}/>Comunidad</button><button className={marketTab==='promos'?'active':''} onClick={()=>goMarketBlock('promos')}><TicketPercent size={17}/>Promos</button></div>
      </section>
      <section className="mkCBanner"><div><span>🎁</span><p>Promos de tu comunidad</p><h2>Descuentos exclusivos para vecinos, colegios y comités</h2><button onClick={()=>goMarketBlock('promos')}>Ver promociones</button></div><div className="mkCBannerGift">%</div></section>
      <CategoryChips category={category} setCategory={setCategory}/>
      {marketTab==='products'&&<div ref={el=>sectionRefs.current.products=el} className="mkCContentBlock">
        <SectionTitle title="Negocios verificados de tu zona" action="Ver negocios" onAction={()=>goMarketBlock('community')}/>
        <div className="mkCBusinessRail">{verifiedBusinesses.map(biz=><BusinessCard key={biz.id} biz={biz} onOpen={openBusiness} favorite={favoriteBusinesses.has(biz.id)} onFavorite={toggleLocalBusinessFavorite}/>)}</div>
        <SectionTitle title="Cerca de ti" action="Ver todos" onAction={()=>setTab('categories')}/>
        <div className="mkCProductGrid">{nearListings.map(item=><ListingCard key={item.id} item={item} onOpen={openListing} onFavorite={toggleLocalListingFavorite} favorite={favoriteListings.has(item.id)}/>)}</div>
      </div>}
      {marketTab==='services'&&<div ref={el=>sectionRefs.current.services=el} className="mkCContentBlock">
        <SectionTitle title="Servicios locales recomendados" action="Publicar servicio" onAction={()=>{setForm({...emptyForm,category:'services',condition:'Servicio'});setShowPublish(true);}}/>
        <div className="mkCProductGrid">{services.map(item=><ListingCard key={item.id} item={item} onOpen={openListing} onFavorite={toggleLocalListingFavorite} favorite={favoriteListings.has(item.id)}/>)}</div>
      </div>}
      {marketTab==='community'&&<div ref={el=>sectionRefs.current.community=el} className="mkCContentBlock">
        <SectionTitle title="Negocios y emprendimientos de tu comunidad" action="Verificados" onAction={()=>setOnlyVerified(v=>!v)}/>
        <div className="mkCBusinessGrid">{businesses.map(biz=><BusinessCard key={biz.id} biz={biz} onOpen={openBusiness} favorite={favoriteBusinesses.has(biz.id)} onFavorite={toggleLocalBusinessFavorite}/>)}</div>
      </div>}
      {marketTab==='promos'&&<div ref={el=>sectionRefs.current.promos=el} className="mkCContentBlock">
        <SectionTitle title="Promos conectadas a Beneficios" action="Abrir Beneficios" onAction={()=>setPage?.('benefits')}/>
        <div className="mkCPromoGrid">{promoSeeds.map(promo=><PromoCard key={promo.id} promo={promo} onOpen={()=>setPage?.('benefits')}/>)}</div>
        <div className="mkCInfoStrip"><Truck size={19}/><b>Entrega local</b><span>Coordina entrega por MiZona Chat o MiZona Ride.</span><ShieldCheck size={19}/><b>Pago seguro</b><span>Prioriza pago contra entrega y negocios verificados.</span></div>
      </div>}
    </>}

    {tab==='categories'&&<section className="mkCPanel"><div className="mkCPageHead"><h1>Categorías</h1><div className="mkCSearch compact"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar categoría o publicación"/></div></div><div className="mkCCategoryGrid">{categories.filter(c=>c.id!=='all').map(c=><button key={c.id} onClick={()=>{setCategory(c.id);setTab('home');}}><span>{c.icon}</span><b>{c.label}</b><ChevronRight size={20}/></button>)}</div></section>}
    {tab==='sell'&&<section className="mkCPanel sellPanel"><h1>Vender en MiZona</h1><p>Publica productos, servicios o promociones de tu negocio. Las publicaciones normales pueden pasar por revisión.</p><div className="mkCSellOptions"><button onClick={()=>{setForm({...emptyForm,condition:'Nuevo'});setShowPublish(true);}}><ShoppingBag/>Producto</button><button onClick={()=>{setForm({...emptyForm,category:'services',condition:'Servicio'});setShowPublish(true);}}><BriefcaseBusiness/>Servicio</button><button onClick={()=>setPage?.('benefits')}><TicketPercent/>Promo / beneficio</button><button onClick={()=>setPage?.('businesses')}><Store/>Registrar negocio</button></div></section>}
    {tab==='orders'&&<section className="mkCPanel ordersPanel"><div className="mkCEmptyBox"><Package size={92}/><h1>Todavía no tienes pedidos</h1><p>Cuando compres o coordines un producto desde MiZona, aparecerá aquí.</p><button onClick={()=>setTab('home')}>Descubrir productos</button></div></section>}
    {tab==='help'&&<section className="mkCPanel helpPanel"><h1>Centro de ayuda Marketplace</h1><div className="mkCHelpList"><button><Store/> Lo básico de MiZona Marketplace <ChevronRight/></button><button><PackageCheck/> ¿Dónde veo el estado de mi pedido? <ChevronRight/></button><button><ShieldCheck/> ¿Qué hago si un vendedor no responde? <ChevronRight/></button><button><Truck/> Entrega local y recojo en tienda <ChevronRight/></button><button><Flag/> Reportar una publicación o negocio <ChevronRight/></button><button><MessageCircle/> Escribir por MiZona Chat <ChevronRight/></button></div></section>}

    <BottomNav active={tab} setActive={setTab}/>

    {selected&&<div className="modalBackdrop" onMouseDown={()=>setSelected(null)}><section className="marketModal commerceDetailModal mkCModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}><X size={18}/></button><div className="marketModalTop"><div className="marketDetailImage">{selected.image_data?<img src={selected.image_data} alt=""/>:<span>{selected.image}</span>}</div><div><p className="eyebrow">{selected.condition}</p><h2>{selected.title}</h2><strong>{money(selected.price)}</strong>{selected.status!=='active'&&<span className={`publicationState ${selected.status}`}>{selected.status}</span>}</div></div><p className="marketDescription">{selected.description}</p><div className="modalFacts"><span><UserRound size={17}/><b>Vendedor</b>@{selected.seller_username} {selected.verified?'· Verificado':''}</span><span><MapPin size={17}/><b>Zona</b>{selected.zone} · {distanceLabel(selected.distance_km)}</span><span><Clock3 size={17}/><b>Publicado</b>{timeLabel(selected.created_at)}</span><span><PackageCheck size={17}/><b>Entrega</b>{selected.delivery?'Entrega coordinada':'Recojo en zona'}</span><span><Sparkles size={17}/><b>Actividad</b>{selected.views||0} vistas · {selected.contact_count||0} contactos</span></div><div className="safeNotice"><ShieldCheck size={20}/><div><b>Consejo de seguridad</b><span>Revisa el artículo antes de pagar y conserva la conversación dentro de MiZona.</span></div></div><div className="modalActions">{selected.is_mine?<><button className="secondary" onClick={()=>setStatus(selected.id,selected.status==='paused'?'active':'paused')}>{selected.status==='paused'?'Reactivar':'Pausar'}</button><button className="primary" onClick={()=>setStatus(selected.id,'sold')}>Marcar vendido</button></>:<><button className="secondary" onClick={()=>toggleLocalListingFavorite(selected.id)}><Heart size={17}/> Guardar</button><button className="secondary" onClick={()=>{reportLocalListing(selected.id,'Publicación sospechosa','Reporte desde el detalle');notify('Reporte enviado.');}}><Flag size={17}/> Reportar</button><button className="primary" onClick={()=>contactSeller(selected)}><MessageCircle size={17}/> Chatear</button></>}</div></section></div>}
    {selectedBusiness&&<div className="modalBackdrop" onMouseDown={()=>setSelectedBusiness(null)}><section className="mkCBusinessModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelectedBusiness(null)}><X size={18}/></button><div className="mkCBusinessCover"><span>{selectedBusiness.emoji}</span></div><div className="mkCBusinessProfile"><div className="mkCBizLogo big"><span>{selectedBusiness.emoji}</span></div><div><h2>{selectedBusiness.name} {selectedBusiness.verified&&<BadgeCheck size={20}/>}</h2><p>{selectedBusiness.description}</p><div className="mkCStars"><Star size={15} fill="currentColor"/> {Number(selectedBusiness.rating||0).toFixed(1)} · {selectedBusiness.review_count||0} reseñas · {distanceLabel(selectedBusiness.distance_km)}</div></div></div><div className="mkCBizFacts"><span><Truck/>Entrega local</span><span><Store/>Recojo en tienda</span><span><ShieldCheck/>Verificado</span></div><div className="modalActions"><button className="primary" onClick={()=>contactBusiness(selectedBusiness)}><MessageCircle size={17}/> Chat</button><button className="secondary" onClick={()=>toggleLocalBusinessFavorite(selectedBusiness.id)}><Bookmark size={17}/> Seguir</button><button className="secondary" onClick={()=>{reportLocalBusiness(selectedBusiness.id,'Información incorrecta','Reporte desde ficha');notify('Reporte enviado.');}}><Flag size={17}/> Reportar</button></div></section></div>}
    {showPublish&&<div className="modalBackdrop" onMouseDown={()=>setShowPublish(false)}><section className="benefitCreateModal" onMouseDown={e=>e.stopPropagation()}><div className="benefitModalHead"><div><p className="eyebrow">Nueva publicación</p><h2>Publicar en Marketplace</h2></div><button onClick={()=>setShowPublish(false)}><X size={18}/></button></div><p className="muted">Puedes publicar productos o servicios. Las cuentas normales pueden pasar por revisión.</p><div className="benefitFormGrid"><label>Título<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ej. Bicicleta aro 20"/></label><label>Categoría<select value={form.category} onChange={e=>setForm({...form,category:e.target.value,image:listingCategoryEmoji[e.target.value]||'📦'})}>{categories.filter(x=>x.id!=='all').map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label><label>Precio<input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Condición<select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}><option>Nuevo</option><option>Usado - excelente</option><option>Usado - bueno</option><option>Usado - regular</option><option>Servicio</option></select></label><label>Zona<input value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})}/></label><label>Foto local<input type="file" accept="image/*" onChange={chooseImage}/></label><label className="wide">Descripción<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe estado, accesorios y forma de entrega"/></label><label className="commerceCheck"><input type="checkbox" checked={form.delivery} onChange={e=>setForm({...form,delivery:e.target.checked})}/> Ofrezco entrega coordinada</label><label className="commerceCheck"><input type="checkbox" checked={form.negotiable} onChange={e=>setForm({...form,negotiable:e.target.checked})}/> Precio negociable</label></div>{form.image_data&&<div className="commerceImagePreview"><img src={form.image_data} alt="Vista previa"/><button onClick={()=>setForm({...form,image_data:null})}>Quitar imagen</button></div>}<div className="benefitFormActions"><button className="secondary" onClick={()=>setShowPublish(false)}>Cancelar</button><button className="primary" onClick={publish}>Enviar publicación</button></div></section></div>}
    {toast&&<div className="toastSuccess"><Sparkles size={17}/>{toast}</div>}{error&&<div className="toastError">⚠️ {error}<button onClick={()=>setError('')}>×</button></div>}
  </div>;
}
