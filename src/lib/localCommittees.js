const KEY='mizona-v8-committee-unified-v281';
const LEGACY='mizona-v8-committee-finance-v28';
const EVENT='mizona:committee-unified-change';
const CHANNEL='mizona-v8-committee-v281';
const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
const uid=p=>`${p}-${crypto?.randomUUID?.()||Date.now()}`;
const now=()=>new Date().toISOString();
const seed=()=>({version:28.1,committee:{id:'aula-4',name:'Comité Aula 4 años',school:'Colegio San Martín',classroom:'Aula 4 años',period:'2026',treasurer:'Milan Aide Guevara',president:'Katia',secretary:'José Hugo',publishEvents:true},families:[
{id:'f1',student:'Adair Alexander',guardian:'José Salazar',phone:'929347128'},
{id:'f2',student:'Cathaleya Xiomara',guardian:'María Guerrero',phone:'930422102'},
{id:'f3',student:'Bella Atenea',guardian:'Rosa Jiménez',phone:'902933032'},
{id:'f4',student:'Dheyamara Bryana',guardian:'Reyes Valerio',phone:'907193012'},
{id:'f5',student:'Celeste Darley',guardian:'Rosas López',phone:'937339501'},
{id:'f6',student:'Zoe Salomé',guardian:'Ruiz Padilla',phone:'955183071'},
{id:'f7',student:'Xianna Kaitlyn',guardian:'Villegas Mendoza',phone:'935464365'}],campaigns:[
{id:'c1',name:'Cuota mensual junio',category:'Aseo, auxiliar y copias',amount:36,dueDate:'2026-06-25',status:'active',description:'Cuota regular para auxiliar, limpieza y copias.',createdAt:now()},
{id:'c2',name:'Vestimenta de danza',category:'Actividad escolar',amount:55,dueDate:'2026-07-08',status:'active',description:'Separación de tallas y confección de vestimenta.',createdAt:now()},
{id:'c3',name:'Compartir cumpleaños profesoras',category:'Cumpleaños',amount:18,dueDate:'2026-07-10',status:'active',description:'Torta, sándwiches y chicha para compartir.',createdAt:now()}],payments:[
{id:'p1',familyId:'f1',campaignId:'c1',amount:36,date:'2026-06-24',method:'Yape',reference:'OP-001',receiptName:''},
{id:'p2',familyId:'f2',campaignId:'c1',amount:36,date:'2026-06-25',method:'Efectivo',reference:'REC-002',receiptName:''},
{id:'p3',familyId:'f3',campaignId:'c2',amount:55,date:'2026-07-05',method:'Yape',reference:'OP-003',receiptName:''},
{id:'p4',familyId:'f1',campaignId:'c3',amount:18,date:'2026-07-06',method:'Plin',reference:'OP-004',receiptName:''}],expenses:[
{id:'e1',campaignId:'c1',concept:'Material de limpieza y copias',detail:'Compra de insumos de aseo y reproducción de fichas.',amount:120,date:'2026-06-28',responsible:'Tesorería',receipt:'Boleta 001-245',receiptName:''},
{id:'e2',campaignId:'c3',concept:'Separación de torta',detail:'Adelanto para asegurar el pedido del 10 de julio.',amount:65,date:'2026-07-06',responsible:'Katia',receipt:'Adelanto',receiptName:''}],
members:[{id:'m1',name:'Katia',role:'Presidenta',phone:'932530200'},{id:'m2',name:'Milan Aide Guevara',role:'Tesorera',phone:'900000000'},{id:'m3',name:'José Hugo',role:'Secretario',phone:'900000001'}],
announcements:[{id:'a1',title:'Compartir por cumpleaños',body:'Se propone preparar sándwiches, chicha y comprar una torta. Se solicita opinión y apoyo de las familias.',audience:'Familias del aula',published:true,createdAt:now()}],
events:[{id:'v1',title:'Cumpleaños de la maestra y auxiliar',date:'2026-07-10',time:'10:00',place:'Aula 4 años',description:'Compartir organizado por el comité.',publishHome:true,createdAt:now()}],
minutes:[{id:'n1',title:'Acuerdo de cuota mensual',date:'2026-06-05',summary:'Se acordó una cuota de S/ 36 para auxiliar, aseo y copias.',agreements:'Vencimiento el día 25 de cada mes.',fileName:''}],
documents:[{id:'d1',title:'Padrón de familias',category:'Padrón',fileName:'padron-aula.xlsx',note:'Relación de estudiantes, apoderados y teléfonos.',createdAt:now()}],reminders:[],audit:[],updatedAt:now()});
function normalize(raw){const s=seed();return {...s,...raw,committee:{...s.committee,...(raw?.committee||{})},families:Array.isArray(raw?.families)?raw.families:s.families,campaigns:Array.isArray(raw?.campaigns)?raw.campaigns:s.campaigns,payments:Array.isArray(raw?.payments)?raw.payments:s.payments,expenses:Array.isArray(raw?.expenses)?raw.expenses:s.expenses,members:Array.isArray(raw?.members)?raw.members:s.members,announcements:Array.isArray(raw?.announcements)?raw.announcements:s.announcements,events:Array.isArray(raw?.events)?raw.events:s.events,minutes:Array.isArray(raw?.minutes)?raw.minutes:s.minutes,documents:Array.isArray(raw?.documents)?raw.documents:s.documents,reminders:Array.isArray(raw?.reminders)?raw.reminders:[],audit:Array.isArray(raw?.audit)?raw.audit:[]}}
function read(){try{let raw=JSON.parse(localStorage.getItem(KEY)||'null');if(!raw){raw=JSON.parse(localStorage.getItem(LEGACY)||'null');if(raw)localStorage.setItem(KEY,JSON.stringify(normalize(raw)))}return normalize(raw)}catch{return seed()}}
function write(data,action='Actualización'){const next={...normalize(data),updatedAt:now()};next.audit=[{id:uid('log'),action,at:now()},...(next.audit||[])].slice(0,250);localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent(EVENT,{detail:clone(next)}));try{new BroadcastChannel(CHANNEL).postMessage({type:'change'})}catch{}return next}
export const getCommitteeFinance=()=>clone(read());
export const saveCommitteeFinance=(updater,action)=>write(typeof updater==='function'?updater(read()):updater,action);
const add=(field,prefix,data,defaults={})=>saveCommitteeFinance(s=>({...s,[field]:[{id:uid(prefix),...defaults,...data},...s[field]]}),`Nuevo registro en ${field}`);
export const addCampaign=data=>add('campaigns','c',data,{status:'active',createdAt:now()});
export const addPayment=data=>add('payments','p',data,{date:now().slice(0,10)});
export const addExpense=data=>add('expenses','e',data,{date:now().slice(0,10)});
export const addFamily=data=>add('families','f',data);
export const addMember=data=>add('members','m',data);
export const addAnnouncement=data=>add('announcements','a',data,{published:true,createdAt:now()});
export const addEvent=data=>add('events','v',data,{publishHome:false,createdAt:now()});
export const addMinute=data=>add('minutes','n',data,{date:now().slice(0,10)});
export const addDocument=data=>add('documents','d',data,{createdAt:now()});
export const updateCommittee=data=>saveCommitteeFinance(s=>({...s,committee:{...s.committee,...data}}),'Configuración del comité');
export const toggleCampaign=(id)=>saveCommitteeFinance(s=>({...s,campaigns:s.campaigns.map(c=>c.id===id?{...c,status:c.status==='active'?'closed':'active'}:c)}),'Cambio de estado de cuota');
export const removeRecord=(field,id)=>saveCommitteeFinance(s=>({...s,[field]:s[field].filter(x=>x.id!==id)}),`Eliminación en ${field}`);
export const markReminder=(familyId,campaignId)=>saveCommitteeFinance(s=>({...s,reminders:[{id:uid('r'),familyId,campaignId,sentAt:now()},...s.reminders]}),'Recordatorio preparado');
export function subscribeCommitteeFinance(cb){const h=()=>cb(getCommitteeFinance());window.addEventListener(EVENT,h);window.addEventListener('storage',h);let ch;try{ch=new BroadcastChannel(CHANNEL);ch.onmessage=h}catch{}return()=>{window.removeEventListener(EVENT,h);window.removeEventListener('storage',h);ch?.close()}}
