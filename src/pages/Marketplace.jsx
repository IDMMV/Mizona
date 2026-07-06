import { useMemo, useState } from 'react';
import {
  BadgeCheck, CalendarDays, CheckCircle2, ChevronRight, Clock3, Filter,
  Flag, Heart, MapPin, MessageCircle, PackageCheck, Search, ShieldCheck,
  ShoppingBag, SlidersHorizontal, Sparkles, Tag, UserRound, X
} from 'lucide-react';
import Card from '../components/Card';

const categories=[
  {id:'all',label:'Todo',icon:'✨'},
  {id:'home',label:'Hogar',icon:'🏠'},
  {id:'tech',label:'Tecnología',icon:'📱'},
  {id:'school',label:'Escolar',icon:'🎒'},
  {id:'fashion',label:'Ropa',icon:'👕'},
  {id:'kids',label:'Niños',icon:'🧸'},
  {id:'services',label:'Servicios',icon:'🛠️'}
];

const seed=[
  {id:'mk-1',category:'school',title:'Mochila escolar nueva',price:48,condition:'Nuevo',seller:'María_1987',zone:'Pachacútec',distance:'450 m',created:'Hace 15 min',image:'🎒',verified:true,delivery:false,description:'Mochila reforzada, tres compartimentos y espacio para tomatodo.',tags:['Recojo en zona','Precio fijo']},
  {id:'mk-2',category:'tech',title:'Tablet Samsung 10 pulgadas',price:480,condition:'Usado - excelente',seller:'CarlosTech',zone:'Ventanilla',distance:'1.4 km',created:'Hace 40 min',image:'📱',verified:true,delivery:true,description:'Incluye cargador, funda y vidrio templado. Batería en buen estado.',tags:['Con entrega','Negociable']},
  {id:'mk-3',category:'home',title:'Juego de comedor 4 sillas',price:350,condition:'Usado - bueno',seller:'FamiliaRojas',zone:'Pachacútec',distance:'900 m',created:'Hoy 10:20',image:'🪑',verified:false,delivery:false,description:'Mesa de madera con cuatro sillas. Se vende por mudanza.',tags:['Recojo coordinado']},
  {id:'mk-4',category:'kids',title:'Bicicleta infantil aro 16',price:160,condition:'Usado - bueno',seller:'LuisPadre',zone:'Ventanilla',distance:'2.1 km',created:'Ayer',image:'🚲',verified:true,delivery:false,description:'Ideal para niños de 4 a 7 años. Frenos revisados.',tags:['Incluye rueditas','Negociable']},
  {id:'mk-5',category:'fashion',title:'Casaca impermeable talla M',price:65,condition:'Nuevo',seller:'ModaLocal',zone:'Pachacútec',distance:'600 m',created:'Hace 2 h',image:'🧥',verified:true,delivery:true,description:'Casaca ligera para invierno. Disponible en dos colores.',tags:['Entrega en zona','Cambio por talla']},
  {id:'mk-6',category:'services',title:'Mantenimiento de computadoras',price:35,condition:'Servicio',seller:'TecnoMiguel',zone:'Ventanilla',distance:'1.8 km',created:'Hoy',image:'🧰',verified:true,delivery:true,description:'Limpieza, optimización, instalación de programas y diagnóstico.',tags:['Atención a domicilio','Desde S/ 35']},
  {id:'mk-7',category:'school',title:'Libros de secundaria 2° año',price:80,condition:'Usado - bueno',seller:'Ana_2008',zone:'Pachacútec',distance:'720 m',created:'Hace 3 h',image:'📚',verified:false,delivery:false,description:'Paquete de matemática, comunicación, ciencia y sociales.',tags:['Venta por paquete']},
  {id:'mk-8',category:'home',title:'Cocina de mesa 2 hornillas',price:95,condition:'Usado - regular',seller:'VentaCasa',zone:'Ventanilla',distance:'2.7 km',created:'Ayer',image:'🍳',verified:false,delivery:false,description:'Funciona correctamente. Tiene señales normales de uso.',tags:['Probar antes de comprar']}
];

function ListingCard({item,onOpen,onFavorite,favorite}){
  return <article className="marketCard">
    <div className="marketVisual"><span>{item.image}</span><b>{item.condition}</b></div>
    <div className="marketBody">
      <div className="marketTitle"><div><h3>{item.title}</h3><strong>S/ {item.price.toFixed(2)}</strong></div><button className={`heartBtn ${favorite?'saved':''}`} onClick={()=>onFavorite(item.id)}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div>
      <div className="sellerLine"><UserRound size={15}/><b>@{item.seller}</b>{item.verified&&<BadgeCheck size={16}/>}</div>
      <div className="marketMeta"><span><MapPin size={14}/>{item.zone} · {item.distance}</span><span><Clock3 size={14}/>{item.created}</span></div>
      <div className="placeBadges">{item.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
      <div className="placeActions"><button className="secondary" onClick={()=>onOpen(item)}>Ver detalle</button><button className="primary" onClick={()=>onOpen(item)}>Contactar <ChevronRight size={16}/></button></div>
    </div>
  </article>
}

export default function Marketplace(){
  const [category,setCategory]=useState('all');
  const [query,setQuery]=useState('');
  const [condition,setCondition]=useState('all');
  const [sort,setSort]=useState('recent');
  const [onlyVerified,setOnlyVerified]=useState(false);
  const [selected,setSelected]=useState(null);
  const [favorites,setFavorites]=useState(new Set());
  const [showPublish,setShowPublish]=useState(false);
  const [toast,setToast]=useState('');

  const listings=useMemo(()=>{
    let list=seed.filter(x=>category==='all'||x.category===category)
      .filter(x=>condition==='all'||x.condition.toLowerCase().includes(condition))
      .filter(x=>!onlyVerified||x.verified)
      .filter(x=>`${x.title} ${x.description} ${x.seller} ${x.zone}`.toLowerCase().includes(query.toLowerCase()));
    list=[...list].sort((a,b)=>sort==='priceLow'?a.price-b.price:sort==='priceHigh'?b.price-a.price:sort==='distance'?parseFloat(a.distance)-parseFloat(b.distance):0);
    return list;
  },[category,query,condition,sort,onlyVerified]);

  const notify=t=>{setToast(t);setTimeout(()=>setToast(''),2400)};
  const toggleFavorite=id=>setFavorites(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next});

  return <div className="page marketplacePage">
    <section className="marketHero">
      <div><p className="eyebrow">Compra y vende cerca de ti</p><h1>Marketplace local y seguro</h1><p>Encuentra productos, útiles escolares y servicios de personas de tu zona. Coordina dentro de MiZona sin publicar tu número.</p><div className="heroActions"><button className="primary" onClick={()=>setShowPublish(true)}><ShoppingBag size={17}/> Publicar producto</button><button className="secondary" onClick={()=>notify('Abrimos tus publicaciones guardadas')}><Heart size={17}/> Mis favoritos ({favorites.size})</button></div></div>
      <div className="marketHeroStats"><span><b>326</b> publicaciones activas</span><span><b>91</b> vendedores verificados</span><span><b>18</b> reportes resueltos</span></div>
    </section>

    <section className="marketControls">
      <div className="businessSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca mochila, tablet, bicicleta, libros..."/></div>
      <select value={condition} onChange={e=>setCondition(e.target.value)}><option value="all">Todas las condiciones</option><option value="nuevo">Nuevo</option><option value="usado">Usado</option><option value="servicio">Servicio</option></select>
      <select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Más recientes</option><option value="priceLow">Menor precio</option><option value="priceHigh">Mayor precio</option><option value="distance">Más cercanos</option></select>
      <label><input type="checkbox" checked={onlyVerified} onChange={e=>setOnlyVerified(e.target.checked)}/> Verificados</label>
    </section>

    <div className="categoryRail">{categories.map(c=><button key={c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}><span>{c.icon}</span>{c.label}</button>)}</div>

    <div className="marketLayout">
      <section><div className="sectionTitle"><h2>{listings.length} publicaciones</h2><p>Prioriza perfiles verificados y coordina el encuentro en un lugar seguro.</p></div><div className="marketGrid">{listings.map(item=><ListingCard key={item.id} item={item} onOpen={setSelected} onFavorite={toggleFavorite} favorite={favorites.has(item.id)}/>)}</div>{!listings.length&&<div className="emptyState">No encontramos publicaciones con esos filtros.</div>}</section>
      <aside className="marketSide">
        <Card title="Compra con seguridad" icon="🛡️"><ul className="list compact"><li>No envíes dinero antes de verificar el producto.</li><li>Coordina en lugares públicos y concurridos.</li><li>No compartas claves ni códigos de verificación.</li><li>Reporta perfiles o publicaciones sospechosas.</li></ul></Card>
        <Card title="Lo más buscado" icon="🔥"><div className="trendList"><span><b>1.</b> Útiles escolares <em>+31%</em></span><span><b>2.</b> Celulares usados <em>+24%</em></span><span><b>3.</b> Bicicletas <em>+18%</em></span><span><b>4.</b> Muebles económicos <em>+15%</em></span></div></Card>
        <Card title="Tus publicaciones" icon="📦"><p className="muted">Publica gratis. Los avisos destacados se habilitarán después desde el Centro de Control.</p><button className="primary full" onClick={()=>setShowPublish(true)}>Crear publicación</button></Card>
      </aside>
    </div>

    {selected&&<div className="modalBackdrop" onMouseDown={()=>setSelected(null)}><section className="marketModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}><X size={18}/></button><div className="marketModalTop"><span>{selected.image}</span><div><p className="eyebrow">{selected.condition}</p><h2>{selected.title}</h2><strong>S/ {selected.price.toFixed(2)}</strong></div></div><p className="marketDescription">{selected.description}</p><div className="modalFacts"><span><UserRound size={17}/><b>Vendedor</b>@{selected.seller} {selected.verified?'· Verificado':''}</span><span><MapPin size={17}/><b>Zona</b>{selected.zone} · {selected.distance}</span><span><Clock3 size={17}/><b>Publicado</b>{selected.created}</span><span><PackageCheck size={17}/><b>Entrega</b>{selected.delivery?'Entrega coordinada':'Recojo en zona'}</span></div><div className="safeNotice"><ShieldCheck size={20}/><div><b>Consejo de seguridad</b><span>Revisa el artículo antes de pagar y conserva la conversación dentro de MiZona.</span></div></div><div className="modalActions"><button className="secondary" onClick={()=>notify('Publicación guardada')}><Heart size={17}/> Guardar</button><button className="secondary" onClick={()=>notify('Reporte abierto para revisión')}><Flag size={17}/> Reportar</button><button className="primary" onClick={()=>notify('Chat creado con el vendedor')}><MessageCircle size={17}/> Chatear con vendedor</button></div></section></div>}

    {showPublish&&<div className="modalBackdrop" onMouseDown={()=>setShowPublish(false)}><section className="formModal publishModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setShowPublish(false)}><X size={18}/></button><h2>Publicar en Marketplace</h2><p className="muted">Tu publicación pasará por filtros automáticos y podrá ser reportada por la comunidad.</p><div className="formGrid"><label>Título<input placeholder="Ej. Bicicleta aro 20"/></label><label>Categoría<select><option>Hogar</option><option>Tecnología</option><option>Escolar</option><option>Ropa</option><option>Niños</option><option>Servicios</option></select></label><label>Precio<input type="number" min="0" placeholder="0.00"/></label><label>Condición<select><option>Nuevo</option><option>Usado - excelente</option><option>Usado - bueno</option><option>Usado - regular</option><option>Servicio</option></select></label><label className="fullSpan">Descripción<textarea placeholder="Describe el producto, estado y forma de entrega"/></label><label className="fullSpan">Fotos<input type="file" accept="image/*" multiple/></label></div><div className="policyCheck"><input type="checkbox"/> <span>Confirmo que el artículo es legal, la información es verdadera y acepto las reglas del Marketplace.</span></div><button className="primary wide" onClick={()=>{setShowPublish(false);notify('Publicación enviada a revisión')}}>Enviar publicación</button></section></div>}

    {toast&&<div className="toastSuccess"><Sparkles size={17}/>{toast}</div>}
  </div>;
}
