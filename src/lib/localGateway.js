const KEY='mizona-v8-gateway-v26';
const CHANNEL='mizona-v8-gateway-v26';
const now=()=>new Date().toISOString();
const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const defaults={
 version:26,updated_at:now(),
 settings:{environment:'sandbox',active_provider:'manual',currency:'PEN',auto_capture:true,require_3ds:true,webhook_url:'/api/payments/webhook',settlement_days:2,reserve_percent:5,min_payout:50,allow_refunds:true,allow_partial_refunds:true},
 providers:[
  {id:'manual',name:'Manual / transferencia',enabled:true,configured:true,supports_split:false,supports_refund:true,mode:'sandbox'},
  {id:'culqi',name:'Culqi',enabled:false,configured:false,supports_split:false,supports_refund:true,mode:'sandbox'},
  {id:'niubiz',name:'Niubiz',enabled:false,configured:false,supports_split:false,supports_refund:true,mode:'sandbox'},
  {id:'izipay',name:'Izipay',enabled:false,configured:false,supports_split:false,supports_refund:true,mode:'sandbox'},
  {id:'mercadopago',name:'Mercado Pago',enabled:false,configured:false,supports_split:true,supports_refund:true,mode:'sandbox'},
  {id:'yape',name:'Yape Empresas',enabled:false,configured:false,supports_split:false,supports_refund:false,mode:'sandbox'}
 ],
 events:[
  {id:'evt-demo-1',type:'payment.approved',reference:'PAY-22001',provider:'manual',status:'processed',created_at:now()},
  {id:'evt-demo-2',type:'payment.held',reference:'PAY-22002',provider:'manual',status:'processed',created_at:now()}
 ],
 settlements:[
  {id:'SET-26001',seller:'Pollería Mi Zona',gross:500,commission:40,reserve:25,net:435,status:'available',available_at:now()},
  {id:'SET-26002',seller:'Técnico Carlos',gross:120,commission:12,reserve:6,net:102,status:'held',available_at:now()}
 ],
 refunds:[],audit:[]
};
function normalize(raw){const x=raw&&typeof raw==='object'?raw:{};return {...structuredClone(defaults),...x,settings:{...defaults.settings,...(x.settings||{})},providers:Array.isArray(x.providers)?x.providers:structuredClone(defaults.providers),events:Array.isArray(x.events)?x.events:[],settlements:Array.isArray(x.settlements)?x.settlements:[],refunds:Array.isArray(x.refunds)?x.refunds:[],audit:Array.isArray(x.audit)?x.audit:[]}}
function read(){try{return normalize(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return normalize(null)}}
function write(s,action='update'){s.updated_at=now();s.audit=[{id:uid('audit'),action,created_at:now()},...(s.audit||[])].slice(0,150);localStorage.setItem(KEY,JSON.stringify(s));try{new BroadcastChannel(CHANNEL).postMessage({type:'changed'})}catch{};window.dispatchEvent(new CustomEvent('mizona-gateway-changed'));return s}
export const getGatewayState=()=>read();
export function subscribeGateway(cb){const h=()=>cb(read());window.addEventListener('storage',h);window.addEventListener('mizona-gateway-changed',h);let c;try{c=new BroadcastChannel(CHANNEL);c.onmessage=h}catch{};return()=>{window.removeEventListener('storage',h);window.removeEventListener('mizona-gateway-changed',h);c?.close()}}
export function updateGatewaySettings(p){const s=read();s.settings={...s.settings,...p};return write(s,'gateway_settings_updated')}
export function updateProvider(id,p){const s=read();s.providers=s.providers.map(x=>x.id===id?{...x,...p}:x);return write(s,`provider_${id}_updated`)}
export function setActiveProvider(id){const s=read();const p=s.providers.find(x=>x.id===id);if(!p?.enabled||!p?.configured)throw new Error('El proveedor debe estar activo y configurado.');s.settings.active_provider=id;return write(s,`provider_${id}_activated`)}
export function simulateWebhook(type='payment.approved'){const s=read();const evt={id:uid('evt'),type,reference:`PAY-${Date.now().toString().slice(-8)}`,provider:s.settings.active_provider,status:'processed',created_at:now()};s.events=[evt,...s.events];return write(s,'webhook_simulated')}
export function createSettlement(seller,gross){const s=read();const g=Number(gross||0);const commission=+(g*.08).toFixed(2);const reserve=+(g*(Number(s.settings.reserve_percent||0)/100)).toFixed(2);const row={id:`SET-${Date.now().toString().slice(-8)}`,seller:seller||'Vendedor',gross:g,commission,reserve,net:+(g-commission-reserve).toFixed(2),status:'held',available_at:new Date(Date.now()+Number(s.settings.settlement_days||0)*86400000).toISOString()};s.settlements=[row,...s.settlements];return write(s,'settlement_created')}
export function updateSettlement(id,status){const s=read();s.settlements=s.settlements.map(x=>x.id===id?{...x,status,updated_at:now()}:x);return write(s,`settlement_${status}`)}
export function createRefund(reference,amount,reason){const s=read();const r={id:`REF-${Date.now().toString().slice(-8)}`,reference:reference||'PAY-DEMO',amount:Number(amount||0),reason:reason||'Solicitud del cliente',status:'requested',created_at:now()};s.refunds=[r,...s.refunds];return write(s,'refund_requested')}
export function updateRefund(id,status){const s=read();s.refunds=s.refunds.map(x=>x.id===id?{...x,status,updated_at:now()}:x);return write(s,`refund_${status}`)}
export function exportGateway(){const s=read();const b=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mizona-pasarela-etapa26.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
