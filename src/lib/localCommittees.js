const KEY='mizona-v8-committee-finance-v28';
const EVENT='mizona:committee-finance-change';
const CHANNEL='mizona-v8-committee-v28';
const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
const uid=p=>`${p}-${crypto?.randomUUID?.()||Date.now()}`;
const now=()=>new Date().toISOString();
const seed=()=>({version:28,committee:{id:'aula-4',name:'Comité Aula 4 años',school:'Colegio San Martín',classroom:'Aula 4 años',treasurer:'Milan Aide Guevara'},families:[
{id:'f1',student:'Adair Alexander',guardian:'José Salazar',phone:'929347128'},
{id:'f2',student:'Cathaleya Xiomara',guardian:'María Guerrero',phone:'930422102'},
{id:'f3',student:'Bella Atenea',guardian:'Rosa Jiménez',phone:'902933032'},
{id:'f4',student:'Dheyamara Bryana',guardian:'Reyes Valerio',phone:'907193012'},
{id:'f5',student:'Celeste Darley',guardian:'Rosas López',phone:'937339501'},
{id:'f6',student:'Zoe Salomé',guardian:'Ruiz Padilla',phone:'955183071'},
{id:'f7',student:'Xianna Kaitlyn',guardian:'Villegas Mendoza',phone:'935464365'}],campaigns:[
{id:'c1',name:'Cuota mensual junio',category:'Aseo, auxiliar y copias',amount:36,dueDate:'2026-06-25',status:'active',createdAt:now()},
{id:'c2',name:'Vestimenta de danza',category:'Actividad escolar',amount:55,dueDate:'2026-07-08',status:'active',createdAt:now()},
{id:'c3',name:'Compartir cumpleaños profesoras',category:'Cumpleaños',amount:18,dueDate:'2026-07-10',status:'active',createdAt:now()}],payments:[
{id:'p1',familyId:'f1',campaignId:'c1',amount:36,date:'2026-06-24',method:'Yape',reference:'OP-001'},
{id:'p2',familyId:'f2',campaignId:'c1',amount:36,date:'2026-06-25',method:'Efectivo',reference:'REC-002'},
{id:'p3',familyId:'f3',campaignId:'c2',amount:55,date:'2026-07-05',method:'Yape',reference:'OP-003'},
{id:'p4',familyId:'f1',campaignId:'c3',amount:18,date:'2026-07-06',method:'Plin',reference:'OP-004'}],expenses:[
{id:'e1',campaignId:'c1',concept:'Material de limpieza y copias',amount:120,date:'2026-06-28',receipt:'Boleta 001-245'},
{id:'e2',campaignId:'c3',concept:'Separación de torta',amount:65,date:'2026-07-06',receipt:'Adelanto'}],reminders:[],updatedAt:now()});
function read(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');const s=seed();return raw?{...s,...raw,families:Array.isArray(raw.families)?raw.families:s.families,campaigns:Array.isArray(raw.campaigns)?raw.campaigns:s.campaigns,payments:Array.isArray(raw.payments)?raw.payments:s.payments,expenses:Array.isArray(raw.expenses)?raw.expenses:s.expenses,reminders:Array.isArray(raw.reminders)?raw.reminders:[]}:s}catch{return seed()}}
function write(data){const next={...data,updatedAt:now()};localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent(EVENT,{detail:clone(next)}));try{new BroadcastChannel(CHANNEL).postMessage({type:'change'})}catch{}return next}
export const getCommitteeFinance=()=>clone(read());
export const saveCommitteeFinance=updater=>write(typeof updater==='function'?updater(read()):updater);
export const addCampaign=data=>saveCommitteeFinance(s=>({...s,campaigns:[{id:uid('c'),status:'active',createdAt:now(),...data},...s.campaigns]}));
export const addPayment=data=>saveCommitteeFinance(s=>({...s,payments:[{id:uid('p'),date:now().slice(0,10),...data},...s.payments]}));
export const addExpense=data=>saveCommitteeFinance(s=>({...s,expenses:[{id:uid('e'),date:now().slice(0,10),...data},...s.expenses]}));
export const addFamily=data=>saveCommitteeFinance(s=>({...s,families:[{id:uid('f'),...data},...s.families]}));
export const markReminder=(familyId,campaignId)=>saveCommitteeFinance(s=>({...s,reminders:[{id:uid('r'),familyId,campaignId,sentAt:now()},...s.reminders]}));
export function subscribeCommitteeFinance(cb){const h=()=>cb(getCommitteeFinance());window.addEventListener(EVENT,h);window.addEventListener('storage',h);let ch;try{ch=new BroadcastChannel(CHANNEL);ch.onmessage=h}catch{}return()=>{window.removeEventListener(EVENT,h);window.removeEventListener('storage',h);ch?.close()}}
