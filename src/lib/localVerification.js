const KEY='mizona-v8-verification-v23';
const CHANNEL='mizona-v8-verification-v23-channel';
const now=()=>new Date().toISOString();
const seed={
 settings:{requireVerifiedForProtectedPayments:true,autoSuspendReports:3,reviewDays:5,showPublicDetails:true},
 requests:[
  {id:'VER-1001',ownerId:'local-user-jose',business:'Hugo Chicken',type:'business',ruc:'20601234567',legalName:'Hugo Chicken E.I.R.L.',activity:'Restaurante',address:'Ventanilla, Callao',status:'pending',submittedAt:now(),expiresAt:'2027-07-01',checks:{identity:true,phone:true,ruc:false,address:false,license:false,professional:false},documents:[{name:'DNI responsable.pdf',type:'Identidad'},{name:'Ficha RUC.pdf',type:'RUC'},{name:'Licencia municipal.pdf',type:'Licencia'}],notes:'Pendiente de revisión administrativa.',risk:20,history:[]},
  {id:'VER-1002',ownerId:'local-user-carlos',business:'Electricista Carlos',type:'service',ruc:'10456789012',legalName:'Carlos Mendoza',activity:'Servicios eléctricos',address:'Pachacútec, Ventanilla',status:'approved',submittedAt:now(),verifiedAt:now(),expiresAt:'2027-01-31',checks:{identity:true,phone:true,ruc:true,address:true,license:false,professional:true},documents:[{name:'DNI.pdf',type:'Identidad'},{name:'RUC.pdf',type:'RUC'},{name:'Certificado técnico.pdf',type:'Certificado'}],notes:'Identidad, RUC y certificado revisados.',risk:8,history:[]}
 ],
 reports:[{id:'REP-2001',targetId:'VER-1002',reporter:'Usuario demo',reason:'Solicitó adelanto fuera de MiZona',severity:'medium',status:'open',createdAt:now()}],
 audit:[]
};
function read(){try{return {...seed,...JSON.parse(localStorage.getItem(KEY)||'null')}}catch{return structuredClone(seed)}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));try{new BroadcastChannel(CHANNEL).postMessage('change')}catch{};window.dispatchEvent(new CustomEvent(CHANNEL));return s}
export const getVerificationState=()=>read();
export function subscribeVerification(cb){const fn=()=>cb(read());window.addEventListener(CHANNEL,fn);let bc;try{bc=new BroadcastChannel(CHANNEL);bc.onmessage=fn}catch{};return()=>{window.removeEventListener(CHANNEL,fn);bc?.close()}}
export function createVerificationRequest(data){const s=read();const r={id:`VER-${Date.now().toString().slice(-6)}`,ownerId:data.ownerId,business:data.business,type:data.type||'business',ruc:data.ruc||'',legalName:data.legalName||'',activity:data.activity||'',address:data.address||'',status:'pending',submittedAt:now(),expiresAt:data.expiresAt||'',checks:{identity:false,phone:false,ruc:false,address:false,license:false,professional:false},documents:data.documents||[],notes:'Solicitud creada.',risk:25,history:[]};s.requests.unshift(r);s.audit.unshift({at:now(),action:'request_created',target:r.id});return save(s)}
export function updateRequest(id,patch,actor='Administrador'){const s=read();const i=s.requests.findIndex(x=>x.id===id);if(i<0)return s;const before=s.requests[i].status;s.requests[i]={...s.requests[i],...patch,history:[{at:now(),actor,action:`${before} → ${patch.status||before}`},...(s.requests[i].history||[])]};if(patch.status==='approved')s.requests[i].verifiedAt=now();s.audit.unshift({at:now(),actor,action:'request_updated',target:id,detail:patch.status||'datos'});return save(s)}
export function toggleCheck(id,key,value){const s=read();const r=s.requests.find(x=>x.id===id);if(!r)return s;r.checks={...r.checks,[key]:value};r.risk=Math.max(0,30-Object.values(r.checks).filter(Boolean).length*4);s.audit.unshift({at:now(),action:'check_updated',target:id,detail:key});return save(s)}
export function addReport(data){const s=read();const rep={id:`REP-${Date.now().toString().slice(-6)}`,status:'open',createdAt:now(),severity:'medium',...data};s.reports.unshift(rep);const count=s.reports.filter(x=>x.targetId===data.targetId&&x.status==='open').length;if(count>=s.settings.autoSuspendReports){const r=s.requests.find(x=>x.id===data.targetId);if(r)r.status='suspended'}return save(s)}
export function updateReport(id,status){const s=read();const r=s.reports.find(x=>x.id===id);if(r)r.status=status;return save(s)}
export function updateVerificationSettings(patch){const s=read();s.settings={...s.settings,...patch};return save(s)}
export function downloadVerificationReport(){const blob=new Blob([JSON.stringify(read(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mizona-verificacion-antifraude.json';a.click();URL.revokeObjectURL(a.href)}
