const pages=[...document.querySelectorAll('.page')];
function showPage(id){
  pages.forEach(p=>p.classList.toggle('active',p.id===id));
  document.querySelectorAll('[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',e=>{
  const link=e.target.closest('[data-page]');
  if(link){e.preventDefault();showPage(link.dataset.page)}
});
function fakeSave(msg='Guardado correctamente') { alert(msg); }
function createCoupon(){
  const title=document.querySelector('#couponTitle')?.value || 'Nueva promoción';
  const list=document.querySelector('#couponList');
  if(list){list.insertAdjacentHTML('afterbegin',`<div class="item"><div class="icon">🎁</div><div><b>${title}</b><div class="muted">Cupón creado en modo prototipo</div></div><span class="pill ok">Activo</span></div>`)}
}
function uploadTransfer(){
  const name=document.querySelector('#transferFile')?.files?.[0]?.name || 'archivo_demo.pdf';
  const box=document.querySelector('#transferResult');
  if(box){box.innerHTML=`<div class="notice"><b>Enlace temporal creado:</b><br> ${name}<br>Vence automáticamente en 7 días.</div>`}
}
window.showPage=showPage; window.fakeSave=fakeSave; window.createCoupon=createCoupon; window.uploadTransfer=uploadTransfer;


// Etapa 7 - Negocios
const businesses=[
  {name:'Pollos Junito',cat:'Restaurante',zone:'Pachacútec',dist:'450 m',verified:true,offer:'Combo familiar S/49',rating:'4.7'},
  {name:'Hamburguesería Lolita',cat:'Restaurante',zone:'Ventanilla',dist:'800 m',verified:false,offer:'Ficha básica',rating:'4.5'},
  {name:'Farmacia Vida',cat:'Farmacia',zone:'Mi Perú',dist:'1.2 km',verified:true,offer:'15% en genéricos',rating:'4.6'},
  {name:'Electricista Rápido',cat:'Servicio',zone:'Pachacútec',dist:'900 m',verified:false,offer:'Disponible por confirmar',rating:'4.2'},
  {name:'Colegio San Martín',cat:'Colegio',zone:'Ventanilla',dist:'1.6 km',verified:true,offer:'Comunicados activos',rating:'--'}
];
function renderBusinesses(list=businesses){
 const box=document.getElementById('businessList'); if(!box)return;
 box.innerHTML=list.map(b=>`<div class="item"><div class="icon">${b.cat==='Restaurante'?'🍔':b.cat==='Farmacia'?'💊':b.cat==='Servicio'?'🛠':'🏫'}</div><div><b>${b.name}</b><div class="muted">${b.cat} · ${b.zone} · ${b.dist} · ⭐ ${b.rating}</div><div class="biz-badges"><span class="pill ${b.verified?'ok':''}">${b.verified?'Verificado MiZona':'No afiliado'}</span><span class="pill warn">${b.offer}</span></div></div><button class="btn ghost" onclick="alert('Ficha demo de ${b.name}')">Ver</button></div>`).join('');
}
function filterBusinesses(){
 const q=(document.getElementById('bizSearch')?.value||'').toLowerCase();
 const c=document.getElementById('bizCategory')?.value||'';
 renderBusinesses(businesses.filter(b=>(!q||b.name.toLowerCase().includes(q)||b.cat.toLowerCase().includes(q)||b.zone.toLowerCase().includes(q))&&(!c||b.cat===c)));
}
function switchNegTab(name,btn){
 document.querySelectorAll('.neg-tab').forEach(t=>t.classList.remove('active'));
 document.getElementById('neg-'+name)?.classList.add('active');
 document.querySelectorAll('#negocios .tab').forEach(t=>t.classList.remove('active'));
 btn?.classList.add('active');
}
function showClaimDemo(){ switchNegTab('reclamos',document.querySelectorAll('#negocios .tab')[1]); }
function createCampaign(){
 const title=document.getElementById('campaignTitle')?.value.trim()||'Nueva campaña';
 const limit=document.getElementById('campaignLimit')?.value||'10';
 const type=document.getElementById('campaignType')?.value||'Cupón';
 const box=document.getElementById('campaignList'); if(!box)return;
 box.insertAdjacentHTML('afterbegin',`<div class="item"><div class="icon">🎯</div><div><b>${title}</b><div class="muted">${type} · ${limit} disponibles · creado ahora</div></div><span class="pill ok">Activo</span></div>`);
}
renderBusinesses();


// Etapa 8 - Marketplace
const marketItems=[
  {title:'Uniforme escolar talla 12',type:'Escolar',zone:'Colegio San Martín',price:'S/ 35',seller:'@MARIA_PACHACUTEC',status:'Verificado'},
  {title:'Bicicleta aro 26',type:'Venta',zone:'Ventanilla',price:'S/ 280',seller:'@CARLOS_2026',status:'Nuevo'},
  {title:'Alquiler de toldo para eventos',type:'Alquiler',zone:'Pachacútec',price:'Desde S/ 80',seller:'@TOLDOS_LIMA',status:'Servicio'},
  {title:'Clases de matemática primaria',type:'Servicio',zone:'Mi Perú',price:'S/ 20/hora',seller:'@PROFE_ANA',status:'Verificado'},
  {title:'Mochila escolar buen estado',type:'Escolar',zone:'Ventanilla',price:'S/ 25',seller:'@LUIS_5A',status:'Escolar'}
];
function renderMarket(list=marketItems){
 const box=document.getElementById('marketList'); if(!box)return;
 box.innerHTML=list.map(i=>`<div class="item"><div class="icon">${i.type==='Escolar'?'🎒':i.type==='Alquiler'?'🏠':i.type==='Servicio'?'🛠':'🏷'}</div><div><b>${i.title}</b><div class="muted">${i.type} · ${i.zone} · vendedor ${i.seller}</div><div class="market-meta"><span class="price">${i.price}</span><span class="pill ${i.status==='Verificado'?'ok':i.status==='Nuevo'?'':'warn'}">${i.status}</span></div></div><button class="btn ghost" onclick="alert('Abrir publicación demo: ${i.title}')">Ver</button></div>`).join('');
}
function filterMarket(){
 const q=(document.getElementById('marketSearch')?.value||'').toLowerCase();
 const c=document.getElementById('marketCategory')?.value||'';
 renderMarket(marketItems.filter(i=>(!q||i.title.toLowerCase().includes(q)||i.zone.toLowerCase().includes(q)||i.seller.toLowerCase().includes(q))&&(!c||i.type===c)));
}
function setMarketFilter(type){ const s=document.getElementById('marketCategory'); if(s){s.value=type; filterMarket(); showPage('marketplace');}}
function switchMarketTab(name,btn){
 document.querySelectorAll('.market-tab').forEach(t=>t.classList.remove('active'));
 document.getElementById('market-'+name)?.classList.add('active');
 document.querySelectorAll('#marketplace .tab').forEach(t=>t.classList.remove('active'));
 btn?.classList.add('active');
}
function createMarketPost(){
 const title=document.getElementById('marketTitle')?.value.trim()||'Nueva publicación';
 const type=document.getElementById('marketType')?.value||'Venta';
 const price=document.getElementById('marketPrice')?.value.trim()||'Precio por definir';
 marketItems.unshift({title,type,zone:'Mi zona',price,seller:'@JOSE_ADMIN',status:'Nuevo'});
 renderMarket();
 switchMarketTab('explorar',document.querySelectorAll('#marketplace .tab')[0]);
 alert('Publicación agregada al prototipo. En producción pasará por reglas de seguridad y moderación.');
}
renderMarket();


// Etapa 9 - CampusHugo
const lessons=[
 {title:'Excel 1: conocer la hoja de cálculo',cat:'Excel',time:'8 min',status:'Disponible'},
 {title:'Excel 2: fórmulas básicas',cat:'Excel',time:'12 min',status:'Disponible'},
 {title:'CV rápido para postular',cat:'Empleabilidad',time:'10 min',status:'Nuevo'},
 {title:'Cómo calcular ganancia de un producto',cat:'Negocio',time:'9 min',status:'Recomendado'},
 {title:'Cómo evitar estafas digitales',cat:'Seguridad',time:'7 min',status:'Importante'}
];
function renderLessons(){
 const box=document.getElementById('lessonList'); if(!box)return;
 box.innerHTML=lessons.map(l=>`<div class="item"><div class="icon">📚</div><div><b>${l.title}</b><div class="muted">${l.cat} · ${l.time}</div></div><span class="pill ${l.status==='Disponible'?'ok':l.status==='Importante'?'danger':'warn'}">${l.status}</span></div>`).join('');
}
function switchCampusTab(name,btn){
 document.querySelectorAll('.campus-tab').forEach(t=>t.classList.remove('active'));
 document.getElementById('campus-'+name)?.classList.add('active');
 document.querySelectorAll('#campus .tab').forEach(t=>t.classList.remove('active'));
 btn?.classList.add('active');
}
function createLesson(){
 const title=document.getElementById('lessonTitle')?.value.trim()||'Nueva clase';
 const cat=document.getElementById('lessonCat')?.value||'Excel';
 lessons.unshift({title,cat,time:'5 min',status:'Nuevo'});
 renderLessons();
 switchCampusTab('clases',document.querySelectorAll('#campus .tab')[1]);
}
renderLessons();

// Etapa 10 - MiZona Business
function switchBusinessTab(name,btn){
 document.querySelectorAll('.business-tab').forEach(t=>t.classList.remove('active'));
 document.getElementById('business-'+name)?.classList.add('active');
 document.querySelectorAll('#business .tab').forEach(t=>t.classList.remove('active'));
 btn?.classList.add('active');
}
function addSale(){
 const product=document.getElementById('saleProduct')?.value.trim()||'Venta rápida';
 const amount=document.getElementById('saleAmount')?.value.trim()||'0';
 const box=document.getElementById('salesList'); if(!box)return;
 box.insertAdjacentHTML('afterbegin',`<div class="item"><div class="icon">🧾</div><div><b>${product}</b><div class="muted">S/${amount} · registrado ahora</div></div><span class="pill ok">Pagado</span></div>`);
}


// Etapa 11 - MiZona Ride
const drivers=[
 {name:'@CARLOS_RIDE',type:'Auto',zone:'Pachacútec',dist:'600 m',rating:'4.8',status:'Disponible'},
 {name:'@MOTO_LUIS',type:'Moto',zone:'Ventanilla',dist:'900 m',rating:'4.7',status:'Disponible'},
 {name:'@ANA_DELIVERY',type:'Delivery',zone:'Mi Perú',dist:'1.4 km',rating:'4.9',status:'Ocupado'},
 {name:'@TAXI_SEGURO',type:'Taxi local',zone:'Callao',dist:'2.1 km',rating:'4.6',status:'Disponible'}
];
function renderDrivers(){
 const box=document.getElementById('driverList'); if(!box)return;
 box.innerHTML=drivers.map(d=>`<div class="item"><div class="icon">${d.type==='Moto'?'🏍':d.type==='Delivery'?'📦':'🚕'}</div><div><b>${d.name}</b><div class="muted">${d.type} · ${d.zone} · ${d.dist} · ⭐ ${d.rating}</div></div><span class="pill ${d.status==='Disponible'?'ok':'warn'}">${d.status}</span></div>`).join('');
}
function switchRideTab(name,btn){
 document.querySelectorAll('.ride-tab').forEach(t=>t.classList.remove('active'));
 document.getElementById('ride-'+name)?.classList.add('active');
 document.querySelectorAll('#ride .tab').forEach(t=>t.classList.remove('active'));
 btn?.classList.add('active');
}
function simulateRide(){
 const o=document.getElementById('rideOrigen')?.value||'Origen actual';
 const d=document.getElementById('rideDestino')?.value||'Destino';
 const t=document.getElementById('rideTipo')?.value||'Auto';
 const box=document.getElementById('rideResult'); if(!box)return;
 box.innerHTML=`<div class="ride-route"><b>Solicitud demo creada</b><br>${o} → ${d}<br>Tipo: ${t}<br>Tarifa estimada: S/ 8 - S/ 14<br><small>En producción se calculará por distancia, zona, horario y disponibilidad.</small></div>`;
}
renderDrivers();


// Etapa 12 - IA MiZona
function askIA(text){
  const input=document.getElementById('iaPrompt');
  const prompt=(text || input?.value || '').trim();
  if(!prompt) return;
  const messages=document.getElementById('iaMessages');
  const classifier=document.getElementById('iaClassifier');
  const lower=prompt.toLowerCase();
  let tipo='Necesidad general', icon='🔎', destino='Mi Panel';
  let respuesta='Te recomiendo revisar el Radar de MiZona y las oportunidades cercanas.';
  if(/hambre|pollo|menú|menu|comer|restaurante|pizza|hamburguesa/.test(lower)){tipo='Alimentación y ahorro'; icon='🍗'; destino='Beneficios / Negocios'; respuesta='Encontré una necesidad de comida. Te mostraría restaurantes cercanos, promociones activas y cupones disponibles.';}
  else if(/trabajo|empleo|chamba|práctica|practica/.test(lower)){tipo='Empleo'; icon='💼'; destino='Beneficios / Empleos'; respuesta='Encontré una necesidad laboral. Te mostraría empleos cercanos, requisitos y opciones de capacitación en CampusHugo.';}
  else if(/tarea|colegio|curso|aprender|excel|matemática|matematica/.test(lower)){tipo='Educación'; icon='📚'; destino='Mi Comunidad / CampusHugo'; respuesta='Encontré una necesidad educativa. Te mostraría Aula Chat, archivos escolares, cursos y apoyo de CampusHugo.';}
  else if(/gasfitero|electricista|reparar|técnico|tecnico|servicio/.test(lower)){tipo='Servicio local'; icon='🛠'; destino='Servicios / Negocios'; respuesta='Encontré una necesidad de servicio. Te mostraría profesionales cercanos, reputación y contacto por MiZona Chat.';}
  else if(/promoción|promocion|oferta|descuento|barato|ahorrar/.test(lower)){tipo='Ahorro'; icon='💰'; destino='Beneficios'; respuesta='Encontré una necesidad de ahorro. Te mostraría ofertas, cupones, precios bajos y oportunidades vigentes.';}
  if(messages){messages.insertAdjacentHTML('beforeend',`<div class="bubble user">${prompt}</div><div class="bubble bot"><b>${icon} ${tipo}</b><br>${respuesta}<br><span class="muted">Destino sugerido: ${destino}</span></div>`)}
  if(classifier){classifier.insertAdjacentHTML('afterbegin',`<div class="item"><div class="icon">${icon}</div><div><b>${tipo}</b><div class="muted">Consulta: ${prompt} · módulo: ${destino}</div></div><span class="pill ok">Clasificado</span></div>`)}
  if(input && !text) input.value='';
}
window.askIA=askIA;
