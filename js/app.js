const MODULES=[
 {id:'panel',name:'Mi Panel',icon:'🏠',route:'index.html',status:'Activo',phase:100,role:'Todos'},
 {id:'comunidad',name:'Mi Comunidad',icon:'👥',route:'modulos/mi-comunidad/index.html',status:'Activo',phase:100,role:'Todos'},
 {id:'negocios',name:'Negocios',icon:'🏪',route:'modulos/negocios/index.html',status:'Activo',phase:80,role:'Todos'},
 {id:'beneficios',name:'Beneficios',icon:'🎁',route:'modulos/beneficios/index.html',status:'Activo',phase:70,role:'Todos'},
 {id:'marketplace',name:'Marketplace',icon:'🛍️',route:'modulos/marketplace/index.html',status:'Pruebas',phase:45,role:'Todos'},
 {id:'servicios',name:'Servicios',icon:'🛠️',route:'modulos/servicios/index.html',status:'Activo',phase:75,role:'Todos'},
 {id:'agenda',name:'Agenda',icon:'📅',route:'modulos/agenda/index.html',status:'Activo',phase:65,role:'Todos'},
 {id:'conversaciones',name:'Conversaciones',icon:'💬',route:'modulos/conversaciones/index.html',status:'Pruebas',phase:40,role:'Registrados'},
 {id:'business',name:'MiZona Business',icon:'💼',route:'modulos/business/index.html',status:'Desactivado',phase:35,role:'Negocios'},
 {id:'ride',name:'MiZona Ride',icon:'🚗',route:'modulos/ride/index.html',status:'Desactivado',phase:20,role:'Conductores'},
 {id:'campus',name:'CampusHugo',icon:'🎓',route:'modulos/campushugo/index.html',status:'Desactivado',phase:25,role:'Todos'},
 {id:'cuenta',name:'Mi Cuenta',icon:'👤',route:'modulos/cuenta/index.html',status:'Activo',phase:90,role:'Registrados'},
 {id:'admin',name:'Administración',icon:'⚙️',route:'modulos/admin/index.html',status:'Activo',phase:100,role:'Admin'}
];
function getStates(){return JSON.parse(localStorage.getItem('mizona_module_states')||'{}')}
function saveState(id,status){let s=getStates();s[id]=status;localStorage.setItem('mizona_module_states',JSON.stringify(s));renderNav();renderAdmin&&renderAdmin()}
function effective(m){return getStates()[m.id]||m.status}
function pill(status){let cls=status==='Activo'?'ok':status==='Pruebas'||status==='Mantenimiento'?'warn':'off';return `<span class="pill ${cls}">${status}</span>`}
function tag(status){let cls=status==='Activo'?'ok':status==='Pruebas'||status==='Mantenimiento'?'warn':'off';return `<span class="tag ${cls}">${status==='Activo'?'ON':status==='Desactivado'?'OFF':'TEST'}</span>`}
function rootPrefix(){return location.pathname.includes('/modulos/')?'../../':''}
function renderNav(){let nav=document.querySelector('#nav'),bottom=document.querySelector('#bottom');if(!nav)return;let prefix=rootPrefix();nav.innerHTML=MODULES.map(m=>{let st=effective(m);let href=st==='Activo'||m.id==='admin'?prefix+m.route:'#';let current=location.pathname.endsWith(m.route)|| (m.id==='panel'&&location.pathname.endsWith('/index.html'));return `<a class="${current?'active':''}" href="${href}" onclick="return guardModule('${m.id}')"><span>${m.icon}</span><span>${m.name}</span>${tag(st)}</a>`}).join(''); if(bottom){let ids=['panel','beneficios','comunidad','conversaciones','cuenta'];bottom.innerHTML=ids.map(id=>{let m=MODULES.find(x=>x.id===id);return `<a href="${prefix+m.route}" onclick="return guardModule('${m.id}')"><b>${m.icon}</b>${m.name.replace('Mi ','')}</a>`}).join('')}}
function guardModule(id){let m=MODULES.find(x=>x.id===id);let st=effective(m); if(st==='Activo'||id==='admin')return true; alert(`${m.name} está en estado: ${st}. El administrador puede activarlo cuando esté listo.`);return false}
function renderCards(){let el=document.querySelector('#moduleCards');if(!el)return;el.innerHTML=MODULES.filter(m=>m.id!=='admin').map(m=>`<div class="module"><div class="ico">${m.icon}</div><div style="flex:1"><b>${m.name}</b><div class="muted">Visible: ${m.role}</div></div>${pill(effective(m))}</div>`).join('')}
function renderAdmin(){let el=document.querySelector('#adminRows');if(!el)return;el.innerHTML=MODULES.map(m=>`<tr><td><b>${m.icon} ${m.name}</b><div class="muted">${m.route}</div></td><td>${m.role}</td><td><div class="phase"><span style="width:${m.phase}%"></span></div><small>${m.phase}% listo</small></td><td>${pill(effective(m))}</td><td><select class="select" onchange="saveState('${m.id}',this.value)"><option ${effective(m)==='Activo'?'selected':''}>Activo</option><option ${effective(m)==='Pruebas'?'selected':''}>Pruebas</option><option ${effective(m)==='Mantenimiento'?'selected':''}>Mantenimiento</option><option ${effective(m)==='Desactivado'?'selected':''}>Desactivado</option></select></td></tr>`).join('')}
function init(){renderNav();renderCards();renderAdmin()}document.addEventListener('DOMContentLoaded',init);
