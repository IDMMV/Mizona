import {
  getActiveLocalProfile,
  getActiveLocalProfileId,
  listLocalProfiles,
  mutateLocalState,
  readLocalState
} from './localStore';

const STATE_KEY = 'mizona-v8-local-commerce-v17';
const CHANGE_EVENT = 'mizona:local-commerce-change';
const CHANNEL_NAME = 'mizona-v8-commerce-v17';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const nowIso = () => new Date().toISOString();
const ago = ms => new Date(Date.now() - ms).toISOString();

const seedBusinesses = [
  { id:'biz-good-flavor', owner_id:'local-maria', name:'Pollería El Buen Sabor', category:'food', emoji:'🍗', zone:'Pachacútec', address:'Mz. H Lt. 12, Pachacútec', description:'Pollo a la brasa, parrillas y delivery local.', hours:'12:00 p. m. – 11:00 p. m.', distance_km:.65, open:true, affiliated:true, verified:true, claimed:true, status:'active', rating:4.8, review_count:246, badges:['Afiliado MiZona','Cupón activo'], offer_title:'Combo familiar', offer_detail:'1 pollo + papas + ensalada + gaseosa', offer_price:'S/ 49.90', views:1860, contact_count:142, created_at:ago(20*86400000), updated_at:ago(2*3600000) },
  { id:'biz-lolita', owner_id:null, name:'Lolita Burger', category:'food', emoji:'🍔', zone:'Pachacútec', address:'Av. 225, Pachacútec', description:'Hamburguesas artesanales, salchipapas y combos familiares.', hours:'4:00 p. m. – 11:30 p. m.', distance_km:.32, open:true, affiliated:false, verified:false, claimed:false, status:'active', rating:4.7, review_count:128, badges:['Muy recomendado'], offer_title:'', offer_detail:'', offer_price:'', views:932, contact_count:0, created_at:ago(25*86400000), updated_at:ago(5*3600000) },
  { id:'biz-pharmacy', owner_id:'local-user-jose', name:'Farmacia Económica', category:'health', emoji:'💊', zone:'Ventanilla', address:'Av. Néstor Gambetta 580', description:'Medicamentos, cuidado personal y orientación farmacéutica.', hours:'24 horas', distance_km:1.1, open:true, affiliated:true, verified:true, claimed:true, status:'active', rating:4.6, review_count:89, badges:['24 horas','Afiliado MiZona'], offer_title:'Cuidado infantil', offer_detail:'15% en productos seleccionados', offer_price:'15% OFF', views:740, contact_count:78, created_at:ago(18*86400000), updated_at:ago(6*3600000) },
  { id:'biz-hardware', owner_id:null, name:'Ferretería Don Carlos', category:'home', emoji:'🧱', zone:'Pachacútec', address:'Mercado Pachacútec, puesto 42', description:'Herramientas, conexiones eléctricas, pinturas y materiales.', hours:'8:00 a. m. – 7:00 p. m.', distance_km:.78, open:true, affiliated:false, verified:false, claimed:false, status:'active', rating:4.8, review_count:152, badges:['Recomendado por vecinos'], offer_title:'', offer_detail:'', offer_price:'', views:664, contact_count:0, created_at:ago(28*86400000), updated_at:ago(10*3600000) },
  { id:'biz-academy', owner_id:'local-teacher', name:'Academia Futuro', category:'education', emoji:'📘', zone:'Ventanilla', address:'Av. La Playa 225', description:'Reforzamiento escolar, preparación universitaria e inglés.', hours:'8:00 a. m. – 8:00 p. m.', distance_km:1.6, open:false, affiliated:true, verified:true, claimed:true, status:'active', rating:4.5, review_count:64, badges:['Matrícula abierta'], offer_title:'Semana de prueba', offer_detail:'Primera semana sin costo', offer_price:'Gratis', views:520, contact_count:44, created_at:ago(16*86400000), updated_at:ago(8*3600000) },
  { id:'biz-electric', owner_id:'local-carlos', name:'Electro Soluciones Miguel', category:'services', emoji:'⚡', zone:'Ventanilla', address:'Atención a domicilio', description:'Instalaciones eléctricas, mantenimiento y emergencias domiciliarias.', hours:'7:00 a. m. – 9:00 p. m.', distance_km:2.2, open:true, affiliated:true, verified:true, claimed:true, status:'active', rating:4.9, review_count:71, badges:['Técnico verificado','Disponible hoy'], offer_title:'Diagnóstico', offer_detail:'Visita técnica en Pachacútec', offer_price:'Desde S/ 25', views:810, contact_count:96, created_at:ago(12*86400000), updated_at:ago(1*3600000) },
  { id:'biz-pending', owner_id:'local-valery', name:'Dulces Valery', category:'food', emoji:'🧁', zone:'Pachacútec', address:'Entrega coordinada', description:'Cupcakes, tortas pequeñas y bocaditos para reuniones.', hours:'Pedidos con 24 h de anticipación', distance_km:.9, open:true, affiliated:false, verified:false, claimed:true, status:'pending', rating:0, review_count:0, badges:['Nuevo negocio'], offer_title:'Caja de cupcakes', offer_detail:'6 unidades decoradas', offer_price:'S/ 28', views:0, contact_count:0, created_at:ago(3*3600000), updated_at:ago(3*3600000) }
];

const seedListings = [
  { id:'mk-1', seller_id:'local-maria', category:'school', title:'Mochila escolar nueva', price:48, condition:'Nuevo', zone:'Pachacútec', distance_km:.45, image:'🎒', image_data:null, verified:true, delivery:false, negotiable:false, description:'Mochila reforzada, tres compartimentos y espacio para tomatodo.', tags:['Recojo en zona','Precio fijo'], status:'active', views:142, contact_count:18, created_at:ago(15*60000), updated_at:ago(15*60000) },
  { id:'mk-2', seller_id:'local-carlos', category:'tech', title:'Tablet Samsung 10 pulgadas', price:480, condition:'Usado - excelente', zone:'Ventanilla', distance_km:1.4, image:'📱', image_data:null, verified:true, delivery:true, negotiable:true, description:'Incluye cargador, funda y vidrio templado. Batería en buen estado.', tags:['Con entrega','Negociable'], status:'active', views:236, contact_count:29, created_at:ago(40*60000), updated_at:ago(40*60000) },
  { id:'mk-3', seller_id:'local-user-jose', category:'home', title:'Juego de comedor 4 sillas', price:350, condition:'Usado - bueno', zone:'Pachacútec', distance_km:.9, image:'🪑', image_data:null, verified:false, delivery:false, negotiable:true, description:'Mesa de madera con cuatro sillas. Se vende por mudanza.', tags:['Recojo coordinado','Negociable'], status:'active', views:98, contact_count:10, created_at:ago(5*3600000), updated_at:ago(5*3600000) },
  { id:'mk-4', seller_id:'local-user-jose', category:'kids', title:'Bicicleta infantil aro 16', price:160, condition:'Usado - bueno', zone:'Ventanilla', distance_km:2.1, image:'🚲', image_data:null, verified:true, delivery:false, negotiable:true, description:'Ideal para niños de 4 a 7 años. Frenos revisados.', tags:['Incluye rueditas','Negociable'], status:'active', views:176, contact_count:22, created_at:ago(86400000), updated_at:ago(12*3600000) },
  { id:'mk-5', seller_id:'local-valery', category:'fashion', title:'Casaca impermeable talla M', price:65, condition:'Nuevo', zone:'Pachacútec', distance_km:.6, image:'🧥', image_data:null, verified:true, delivery:true, negotiable:false, description:'Casaca ligera para invierno. Disponible en dos colores.', tags:['Entrega en zona','Cambio por talla'], status:'active', views:73, contact_count:6, created_at:ago(2*3600000), updated_at:ago(2*3600000) },
  { id:'mk-6', seller_id:'local-carlos', category:'services', title:'Mantenimiento de computadoras', price:35, condition:'Servicio', zone:'Ventanilla', distance_km:1.8, image:'🧰', image_data:null, verified:true, delivery:true, negotiable:false, description:'Limpieza, optimización, instalación de programas y diagnóstico.', tags:['Atención a domicilio','Desde S/ 35'], status:'active', views:208, contact_count:31, created_at:ago(7*3600000), updated_at:ago(4*3600000) },
  { id:'mk-pending', seller_id:'local-valery', category:'school', title:'Cuadernos universitarios x5', price:32, condition:'Nuevo', zone:'Pachacútec', distance_km:.7, image:'📒', image_data:null, verified:false, delivery:false, negotiable:false, description:'Paquete de cinco cuadernos cuadriculados de 100 hojas.', tags:['Paquete completo'], status:'pending', views:0, contact_count:0, created_at:ago(1*3600000), updated_at:ago(1*3600000) }
];

function seedState(){
  return {
    version:17,
    businesses:clone(seedBusinesses),
    business_favorites:[{id:'bf-1',user_id:'local-user-jose',business_id:'biz-good-flavor',created_at:ago(86400000)}],
    business_reviews:[{id:'br-1',user_id:'local-carlos',business_id:'biz-good-flavor',rating:5,comment:'Buena atención y entrega rápida.',created_at:ago(2*86400000)}],
    business_claims:[],
    business_reports:[],
    listings:clone(seedListings),
    listing_favorites:[{id:'lf-1',user_id:'local-user-jose',listing_id:'mk-2',created_at:ago(3*3600000)}],
    listing_reports:[],
    updated_at:nowIso()
  };
}

function migrateState(state){
  const next=state&&typeof state==='object'?state:seedState();
  next.version=17;
  for(const key of ['businesses','business_favorites','business_reviews','business_claims','business_reports','listings','listing_favorites','listing_reports']) next[key]=Array.isArray(next[key])?next[key]:[];
  if(!next.businesses.length) next.businesses=clone(seedBusinesses);
  if(!next.listings.length) next.listings=clone(seedListings);
  next.updated_at=next.updated_at||nowIso();
  return next;
}

export function readLocalCommerceState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
    const migrated=migrateState(parsed);
    if(!parsed)localStorage.setItem(STATE_KEY,JSON.stringify(migrated));
    return clone(migrated);
  }catch{
    const fresh=seedState();localStorage.setItem(STATE_KEY,JSON.stringify(fresh));return clone(fresh);
  }
}

function writeState(next,reason='commerce-update'){
  const state=migrateState(next);state.updated_at=nowIso();localStorage.setItem(STATE_KEY,JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{reason,updated_at:state.updated_at}}));
  channel?.postMessage({reason,updated_at:state.updated_at});return clone(state);
}
function mutateState(mutator,reason){const state=readLocalCommerceState();mutator(state);return writeState(state,reason);}
export function subscribeLocalCommerce(callback){
  const handler=()=>callback(getLocalCommerceSnapshot());
  const storageHandler=e=>{if(e.key===STATE_KEY)handler();};
  const channelHandler=()=>handler();
  window.addEventListener(CHANGE_EVENT,handler);window.addEventListener('storage',storageHandler);channel?.addEventListener('message',channelHandler);
  return()=>{window.removeEventListener(CHANGE_EVENT,handler);window.removeEventListener('storage',storageHandler);channel?.removeEventListener('message',channelHandler);};
}
function isAdmin(profile=getActiveLocalProfile()){return ['admin','super_admin'].includes(profile?.role);}
function profileMap(){return Object.fromEntries(listLocalProfiles().map(p=>[p.id,p]));}
function directoryMap(){return Object.fromEntries((readLocalState().directory||[]).map(p=>[p.id,p]));}
function actorName(id){const p=profileMap()[id]||directoryMap()[id];return p?.displayName||p?.display_name||p?.username||'Usuario local';}
function actorUsername(id){const p=profileMap()[id]||directoryMap()[id];return p?.username||'USUARIO';}
function adminIds(){return (readLocalState().directory||[]).filter(p=>['admin','super_admin'].includes(p.role)&&p.status==='active').map(p=>p.id);}
function audit(action,entityType,entityId,detail='',payload={}){
  const profile=getActiveLocalProfile();
  mutateLocalState(d=>{d.auditLogs=Array.isArray(d.auditLogs)?d.auditLogs:[];d.syncQueue=Array.isArray(d.syncQueue)?d.syncQueue:[];d.auditLogs.unshift({id:uid('audit-commerce'),actor_id:profile.id,action,entity_type:entityType,entity_id:entityId,detail,created_at:nowIso()});d.syncQueue.unshift({id:uid('sync-commerce'),action,entity_type:entityType,entity_id:entityId,payload,status:'local_only',created_at:nowIso()});},`commerce-${action}`);
}
function notify(userIds,{title,body,page,type='commerce'}){
  const ids=[...new Set((userIds||[]).filter(Boolean))];if(!ids.length)return;
  mutateLocalState(d=>{d.notifications=Array.isArray(d.notifications)?d.notifications:[];ids.forEach(user_id=>d.notifications.unshift({id:uid('not-commerce'),user_id,type,title,body,page,read:false,created_at:nowIso()}));},'commerce-notification');
}
function ensureOwnerOrAdmin(ownerId){const p=getActiveLocalProfile();if(ownerId!==p.id&&!isAdmin(p))throw new Error('No tienes permiso para administrar este contenido.');}

export function getLocalCommerceSnapshot(){
  const state=readLocalCommerceState();const profile=getActiveLocalProfile();const users=profileMap();const directory=directoryMap();
  const enrichUser=id=>users[id]||directory[id]||null;
  const businesses=state.businesses.filter(b=>b.status==='active'||b.owner_id===profile.id||isAdmin(profile)).map(b=>({...b,owner:enrichUser(b.owner_id),is_mine:b.owner_id===profile.id,my_review:state.business_reviews.find(r=>r.business_id===b.id&&r.user_id===profile.id)||null}));
  const listings=state.listings.filter(l=>l.status==='active'||l.seller_id===profile.id||isAdmin(profile)).map(l=>({...l,seller:enrichUser(l.seller_id),seller_name:actorName(l.seller_id),seller_username:actorUsername(l.seller_id),is_mine:l.seller_id===profile.id}));
  return {...state,businesses,listings,myBusinessFavoriteIds:state.business_favorites.filter(x=>x.user_id===profile.id).map(x=>x.business_id),myListingFavoriteIds:state.listing_favorites.filter(x=>x.user_id===profile.id).map(x=>x.listing_id),myClaims:state.business_claims.filter(x=>x.requester_id===profile.id),pendingBusinessCount:state.businesses.filter(x=>x.status==='pending').length,pendingClaimCount:state.business_claims.filter(x=>x.status==='pending').length,pendingListingCount:state.listings.filter(x=>x.status==='pending').length,pendingBusinessReportCount:state.business_reports.filter(x=>x.status==='pending').length,pendingListingReportCount:state.listing_reports.filter(x=>x.status==='pending').length};
}

export function createLocalBusiness(values){
  const p=getActiveLocalProfile();const name=String(values.name||'').trim();if(name.length<3)throw new Error('El negocio necesita un nombre de al menos 3 caracteres.');
  const id=uid('biz');const status=isAdmin(p)?'active':'pending';
  mutateState(s=>s.businesses.unshift({id,owner_id:p.id,name,category:values.category||'services',emoji:values.emoji||'🏪',zone:String(values.zone||p.zone||'').trim(),address:String(values.address||'').trim(),description:String(values.description||'').trim(),hours:String(values.hours||'').trim(),distance_km:Number(values.distance_km||1),open:true,affiliated:false,verified:isAdmin(p),claimed:true,status,rating:0,review_count:0,badges:['Nuevo negocio'],offer_title:String(values.offer_title||'').trim(),offer_detail:String(values.offer_detail||'').trim(),offer_price:String(values.offer_price||'').trim(),views:0,contact_count:0,created_at:nowIso(),updated_at:nowIso()}),'business-create');
  audit('business_create','business',id,name,{status});if(status==='pending')notify(adminIds(),{title:'Nuevo negocio pendiente',body:`${name} fue enviado por @${p.username}.`,page:'admin'});return id;
}
export function updateLocalBusiness(id,values){
  let ownerId=null;mutateState(s=>{const b=s.businesses.find(x=>x.id===id);if(!b)throw new Error('El negocio no existe.');ownerId=b.owner_id;ensureOwnerOrAdmin(ownerId);for(const key of ['name','category','emoji','zone','address','description','hours','offer_title','offer_detail','offer_price'])if(values[key]!==undefined)b[key]=String(values[key]??'').trim();if(values.open!==undefined)b.open=Boolean(values.open);b.updated_at=nowIso();},'business-update');audit('business_update','business',id,'Perfil actualizado');return true;
}
export function toggleLocalBusinessFavorite(id){const userId=getActiveLocalProfileId();mutateState(s=>{const i=s.business_favorites.findIndex(x=>x.user_id===userId&&x.business_id===id);if(i>=0)s.business_favorites.splice(i,1);else s.business_favorites.unshift({id:uid('bf'),user_id:userId,business_id:id,created_at:nowIso()});},'business-favorite');return true;}
export function createLocalBusinessClaim(businessId,evidence=''){
  const p=getActiveLocalProfile();const s=readLocalCommerceState();const b=s.businesses.find(x=>x.id===businessId);if(!b)throw new Error('El negocio no existe.');if(b.owner_id)throw new Error('Este negocio ya tiene un propietario registrado.');if(s.business_claims.some(x=>x.business_id===businessId&&x.requester_id===p.id&&x.status==='pending'))throw new Error('Ya tienes una solicitud pendiente.');
  const id=uid('claim');mutateState(d=>d.business_claims.unshift({id,business_id:businessId,requester_id:p.id,evidence:String(evidence||'').trim(),status:'pending',created_at:nowIso(),updated_at:nowIso()}),'business-claim');audit('business_claim_create','business_claim',id,b.name);notify(adminIds(),{title:'Reclamo de negocio',body:`@${p.username} solicita administrar ${b.name}.`,page:'admin'});return id;
}
export function reviewLocalBusinessClaim(claimId,status){
  if(!isAdmin())throw new Error('Solo un administrador puede revisar reclamos.');if(!['approved','rejected'].includes(status))throw new Error('Estado inválido.');let requester=null,business=null;
  mutateState(s=>{const c=s.business_claims.find(x=>x.id===claimId);if(!c)throw new Error('Reclamo no encontrado.');c.status=status;c.updated_at=nowIso();requester=c.requester_id;business=s.businesses.find(x=>x.id===c.business_id);if(status==='approved'&&business){business.owner_id=c.requester_id;business.claimed=true;business.affiliated=true;business.verified=true;business.status='active';business.badges=[...new Set([...(business.badges||[]),'Propietario verificado','Afiliado MiZona'])];business.updated_at=nowIso();}} ,'business-claim-review');audit('business_claim_review','business_claim',claimId,status);notify([requester],{title:status==='approved'?'Negocio verificado':'Reclamo rechazado',body:status==='approved'?`Ya puedes administrar ${business?.name||'tu negocio'}.`:`Tu solicitud para ${business?.name||'el negocio'} no fue aprobada.`,page:'businesses'});return true;
}
export function reviewLocalBusiness(id,status,verified=null){if(!isAdmin())throw new Error('Solo un administrador puede moderar negocios.');let owner=null,name='Negocio';mutateState(s=>{const b=s.businesses.find(x=>x.id===id);if(!b)throw new Error('Negocio no encontrado.');b.status=status;if(verified!==null)b.verified=Boolean(verified);b.updated_at=nowIso();owner=b.owner_id;name=b.name;},'business-review');audit('business_review','business',id,status);notify([owner],{title:'Estado de negocio actualizado',body:`${name}: ${status}.`,page:'businesses'});return true;}
export function rateLocalBusiness(id,rating,comment=''){const userId=getActiveLocalProfileId();const score=Math.max(1,Math.min(5,Number(rating||0)));if(!score)throw new Error('Selecciona una calificación.');mutateState(s=>{let r=s.business_reviews.find(x=>x.business_id===id&&x.user_id===userId);if(r){r.rating=score;r.comment=String(comment||'').trim();r.created_at=nowIso();}else{s.business_reviews.unshift({id:uid('br'),user_id:userId,business_id:id,rating:score,comment:String(comment||'').trim(),created_at:nowIso()});}const rows=s.business_reviews.filter(x=>x.business_id===id);const b=s.businesses.find(x=>x.id===id);if(b){b.review_count=rows.length;b.rating=rows.reduce((a,x)=>a+Number(x.rating||0),0)/Math.max(1,rows.length);}} ,'business-rate');audit('business_rate','business',id,`${score} estrellas`);return true;}
export function reportLocalBusiness(id,reason,details=''){const p=getActiveLocalProfile();const reportId=uid('biz-report');mutateState(s=>s.business_reports.unshift({id:reportId,business_id:id,reporter_id:p.id,reason:String(reason||'Información incorrecta'),details:String(details||'').trim(),status:'pending',created_at:nowIso()}),'business-report');audit('business_report','business',id,reason);notify(adminIds(),{title:'Reporte de negocio',body:`@${p.username} reportó una ficha de negocio.`,page:'admin'});return reportId;}
export function reviewLocalBusinessReport(id,status){if(!isAdmin())throw new Error('Solo un administrador puede revisar reportes.');mutateState(s=>{const r=s.business_reports.find(x=>x.id===id);if(!r)throw new Error('Reporte no encontrado.');r.status=status;r.reviewed_at=nowIso();},'business-report-review');audit('business_report_review','business_report',id,status);return true;}
export function registerLocalBusinessView(id){mutateState(s=>{const b=s.businesses.find(x=>x.id===id);if(b)b.views=Number(b.views||0)+1;},'business-view');}
export function registerLocalBusinessContact(id){mutateState(s=>{const b=s.businesses.find(x=>x.id===id);if(b)b.contact_count=Number(b.contact_count||0)+1;},'business-contact');}

export function createLocalListing(values){
  const p=getActiveLocalProfile();const title=String(values.title||'').trim();if(title.length<4)throw new Error('El título debe tener al menos 4 caracteres.');const price=Number(values.price);if(!Number.isFinite(price)||price<0)throw new Error('Ingresa un precio válido.');
  if(p.accountType==='student'&&!['school','kids','services'].includes(values.category))throw new Error('Las cuentas estudiantiles solo publican en Escolar, Niños o Servicios.');
  const id=uid('listing');const status=isAdmin(p)?'active':'pending';
  mutateState(s=>s.listings.unshift({id,seller_id:p.id,category:values.category||'home',title,price,condition:values.condition||'Nuevo',zone:String(values.zone||p.zone||'').trim(),distance_km:Number(values.distance_km||1),image:values.image||'📦',image_data:values.image_data||null,verified:isAdmin(p),delivery:Boolean(values.delivery),negotiable:Boolean(values.negotiable),description:String(values.description||'').trim(),tags:[values.delivery?'Entrega coordinada':'Recojo en zona',values.negotiable?'Negociable':'Precio fijo'],status,views:0,contact_count:0,created_at:nowIso(),updated_at:nowIso()}),'listing-create');audit('listing_create','market_listing',id,title,{status});if(status==='pending')notify(adminIds(),{title:'Publicación pendiente',body:`@${p.username} publicó ${title}.`,page:'admin'});return id;
}
export function updateLocalListingStatus(id,status){let seller=null,title='Publicación';mutateState(s=>{const l=s.listings.find(x=>x.id===id);if(!l)throw new Error('Publicación no encontrada.');ensureOwnerOrAdmin(l.seller_id);if(!['active','paused','sold','rejected'].includes(status))throw new Error('Estado inválido.');l.status=status;l.updated_at=nowIso();seller=l.seller_id;title=l.title;},'listing-status');audit('listing_status','market_listing',id,status);if(isAdmin())notify([seller],{title:'Marketplace actualizado',body:`${title}: ${status}.`,page:'marketplace'});return true;}
export function reviewLocalListing(id,status,verified=null){if(!isAdmin())throw new Error('Solo un administrador puede moderar publicaciones.');let seller=null,title='Publicación';mutateState(s=>{const l=s.listings.find(x=>x.id===id);if(!l)throw new Error('Publicación no encontrada.');l.status=status;if(verified!==null)l.verified=Boolean(verified);l.updated_at=nowIso();seller=l.seller_id;title=l.title;},'listing-review');audit('listing_review','market_listing',id,status);notify([seller],{title:'Estado de publicación',body:`${title}: ${status}.`,page:'marketplace'});return true;}
export function toggleLocalListingFavorite(id){const userId=getActiveLocalProfileId();mutateState(s=>{const i=s.listing_favorites.findIndex(x=>x.user_id===userId&&x.listing_id===id);if(i>=0)s.listing_favorites.splice(i,1);else s.listing_favorites.unshift({id:uid('lf'),user_id:userId,listing_id:id,created_at:nowIso()});},'listing-favorite');return true;}
export function reportLocalListing(id,reason,details=''){const p=getActiveLocalProfile();const reportId=uid('listing-report');mutateState(s=>s.listing_reports.unshift({id:reportId,listing_id:id,reporter_id:p.id,reason:String(reason||'Publicación sospechosa'),details:String(details||'').trim(),status:'pending',created_at:nowIso()}),'listing-report');audit('listing_report','market_listing',id,reason);notify(adminIds(),{title:'Reporte Marketplace',body:`@${p.username} reportó una publicación.`,page:'admin'});return reportId;}
export function reviewLocalListingReport(id,status){if(!isAdmin())throw new Error('Solo un administrador puede revisar reportes.');mutateState(s=>{const r=s.listing_reports.find(x=>x.id===id);if(!r)throw new Error('Reporte no encontrado.');r.status=status;r.reviewed_at=nowIso();},'listing-report-review');audit('listing_report_review','listing_report',id,status);return true;}
export function registerLocalListingView(id){mutateState(s=>{const l=s.listings.find(x=>x.id===id);if(l)l.views=Number(l.views||0)+1;},'listing-view');}
export function registerLocalListingContact(id){mutateState(s=>{const l=s.listings.find(x=>x.id===id);if(l)l.contact_count=Number(l.contact_count||0)+1;},'listing-contact');}
export function resetLocalCommerce(){localStorage.removeItem(STATE_KEY);writeState(seedState(),'commerce-reset');}
