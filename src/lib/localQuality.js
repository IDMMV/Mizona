const KEY = 'mizona-v8-quality-state-v27';
const CHANNEL = 'mizona-v8-quality-v27';

const checklistTemplate = [
  ['roles','Permisos y perfiles','Revisar adulto, estudiante, negocio, profesor y administrador.'],
  ['mobile','Celular y tablet','Comprobar menú, tarjetas, formularios, tablas y botones.'],
  ['payments','Pagos y devoluciones','Probar todos los modelos, retenciones, devoluciones y liquidaciones.'],
  ['verification','Verificación y antifraude','Revisar solicitudes, documentos, alertas y suspensión.'],
  ['community','Comunidad y comités','Probar miembros, avisos, eventos, gastos y documentos.'],
  ['chat','Chat y archivos','Probar individual, grupos, aula, archivos y restricciones escolares.'],
  ['business','Business y cocina','Probar caja, pedidos, cocina, inventario y reportes.'],
  ['ride','Ride y delivery','Probar solicitud, código, estados, entrega y calificación.'],
  ['backup','Respaldo y recuperación','Descargar respaldo, importar y confirmar integridad.'],
  ['legal','Privacidad y términos','Revisar textos legales, protección de menores y reclamos.']
];

function initialState(){
  return {
    version:27,
    updatedAt:new Date().toISOString(),
    settings:{pilotName:'Piloto MiZona Pachacútec',environment:'local',releaseChannel:'interno',blockReleaseOnCritical:true,requireBackup:true,requireStudentTest:true},
    checklist:checklistTemplate.map(([id,label,detail])=>({id,label,detail,status:'pending',note:''})),
    tests:[],
    incidents:[],
    pilotUsers:[
      {id:'pilot-admin',name:'José',role:'Administrador',group:'Equipo',status:'active'},
      {id:'pilot-school',name:'Colegio San Martín',role:'Comunidad piloto',group:'Colegio',status:'planned'},
      {id:'pilot-committee',name:'Comité Los Pinos',role:'Comunidad piloto',group:'Comité',status:'planned'},
      {id:'pilot-business',name:'Negocio de prueba',role:'Comercio piloto',group:'Negocio',status:'planned'}
    ],
    releases:[]
  };
}

function normalize(raw){
  const base=initialState();
  if(!raw||typeof raw!=='object') return base;
  return {
    ...base,...raw,
    settings:{...base.settings,...(raw.settings||{})},
    checklist:base.checklist.map(item=>({...item,...((raw.checklist||[]).find(x=>x.id===item.id)||{})})),
    tests:Array.isArray(raw.tests)?raw.tests:[],
    incidents:Array.isArray(raw.incidents)?raw.incidents:[],
    pilotUsers:Array.isArray(raw.pilotUsers)&&raw.pilotUsers.length?raw.pilotUsers:base.pilotUsers,
    releases:Array.isArray(raw.releases)?raw.releases:[]
  };
}

export function getQualityState(){
  try{return normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{return initialState();}
}
function save(state){
  const next={...normalize(state),updatedAt:new Date().toISOString()};
  localStorage.setItem(KEY,JSON.stringify(next));
  try{new BroadcastChannel(CHANNEL).postMessage({type:'changed'});}catch{}
  window.dispatchEvent(new CustomEvent('mizona-quality-changed'));
  return next;
}
export function subscribeQuality(cb){
  const handler=()=>cb(getQualityState());
  window.addEventListener('storage',handler);window.addEventListener('mizona-quality-changed',handler);
  let channel;try{channel=new BroadcastChannel(CHANNEL);channel.onmessage=handler;}catch{}
  return()=>{window.removeEventListener('storage',handler);window.removeEventListener('mizona-quality-changed',handler);channel?.close();};
}

function safeJson(key){
  try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}
}

export async function runQualityTests(){
  const results=[];
  const push=(id,label,status,detail)=>results.push({id,label,status,detail,checkedAt:new Date().toISOString()});
  try{localStorage.setItem('__mizona_test__','ok');const ok=localStorage.getItem('__mizona_test__')==='ok';localStorage.removeItem('__mizona_test__');push('storage','Almacenamiento local',ok?'ok':'fail',ok?'Lectura y escritura correctas.':'No se pudo escribir.');}catch(e){push('storage','Almacenamiento local','fail',e.message);}
  push('online','Conectividad',navigator.onLine?'ok':'warning',navigator.onLine?'El dispositivo tiene conexión.':'Modo sin conexión activo.');
  push('service-worker','PWA / Service Worker','serviceWorker' in navigator?'ok':'warning','serviceWorker' in navigator?'Compatible con este navegador.':'El navegador no admite Service Worker.');
  let estimate={};try{estimate=await navigator.storage?.estimate?.()||{};}catch{}
  const usage=estimate.usage||0, quota=estimate.quota||0;
  push('quota','Espacio disponible',quota&&usage/quota>0.85?'warning':'ok',quota?`${Math.round(usage/1024/1024)} MB usados de ${Math.round(quota/1024/1024)} MB.`:'El navegador no informó cuota.');
  const profiles=safeJson('mizona-v8-local-state-v14')?.directory||[];
  push('profiles','Perfiles locales',profiles.length?'ok':'warning',profiles.length?`${profiles.length} perfiles detectados.`:'No se encontraron perfiles migrados.');
  const payments=safeJson('mizona-v8-local-payments-v22');
  push('payments','Configuración de pagos',payments&&Array.isArray(payments.methods)?'ok':'warning',payments&&Array.isArray(payments.methods)?`${payments.methods.length} métodos disponibles.`:'Se aplicará restauración automática al abrir Pagos.');
  const studentBlocked=['admin','localLab','blueprint','sync','cloudCenter','gateway','payments','verification','ride','business','marketplace','businesses','committees','ai'];
  push('student-rules','Protección de estudiantes','ok',`${studentBlocked.length} módulos sensibles definidos para restricción.`);
  const dangerous=['.exe','.bat','.cmd','.vbs','.msi','.js'];
  push('files','Control de archivos','ok',`${dangerous.length} extensiones peligrosas contempladas para bloqueo.`);
  const state=getQualityState();
  return save({...state,tests:results});
}

export function updateChecklist(id,patch){const s=getQualityState();return save({...s,checklist:s.checklist.map(x=>x.id===id?{...x,...patch}:x)});}
export function updateQualitySettings(patch){const s=getQualityState();return save({...s,settings:{...s.settings,...patch}});}
export function addIncident(input){
  const s=getQualityState();
  const incident={id:`INC-${Date.now().toString(36).toUpperCase()}`,title:String(input.title||'Incidencia'),module:String(input.module||'General'),severity:input.severity||'medium',status:'open',detail:String(input.detail||''),createdAt:new Date().toISOString()};
  return save({...s,incidents:[incident,...s.incidents]});
}
export function updateIncident(id,patch){const s=getQualityState();return save({...s,incidents:s.incidents.map(x=>x.id===id?{...x,...patch}:x)});}
export function addPilotUser(input){const s=getQualityState();const item={id:`PIL-${Date.now().toString(36)}`,name:String(input.name||'Participante'),role:String(input.role||'Usuario piloto'),group:String(input.group||'General'),status:'planned'};return save({...s,pilotUsers:[...s.pilotUsers,item]});}
export function updatePilotUser(id,patch){const s=getQualityState();return save({...s,pilotUsers:s.pilotUsers.map(x=>x.id===id?{...x,...patch}:x)});}
export function createReleaseCandidate(){
  const s=getQualityState();
  const critical=s.incidents.filter(x=>x.severity==='critical'&&x.status!=='closed').length;
  const checklistDone=s.checklist.filter(x=>x.status==='done').length;
  const testsFail=s.tests.filter(x=>x.status==='fail').length;
  const blocked=(s.settings.blockReleaseOnCritical&&critical>0)||testsFail>0;
  const release={id:`RC-${Date.now().toString(36).toUpperCase()}`,createdAt:new Date().toISOString(),status:blocked?'blocked':'candidate',critical,testsFail,checklistDone,totalChecklist:s.checklist.length};
  return save({...s,releases:[release,...s.releases]});
}
export function exportQualityReport(){
  const data={exportedAt:new Date().toISOString(),quality:getQualityState(),app:{userAgent:navigator.userAgent,online:navigator.onLine,url:location.href}};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mizona-calidad-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
}
