const KEY='mizona-v8-payments-v22';
const CHANNEL='mizona-v8-payments-v22';
const now=()=>new Date().toISOString();
const id=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const defaults={
 version:22,
 updated_at:now(),
 settings:{
  currency:'PEN',
  default_model:'direct_seller',
  platform_name:'MiZona',
  support_message:'Nunca pagues fuera del flujo indicado en MiZona.',
  commission_percent:8,
  fixed_fee:0,
  minimum_amount:1,
  maximum_amount:2500,
  hold_days:3,
  require_verified_seller:true,
  allow_manual_release:true,
  auto_release_after_days:true,
  refund_window_days:7,
  bank_account_label:'Cuenta empresarial pendiente de configurar',
  bank_account_mask:'•••• •••• ••••',
  wallet_phone:'',
  provider:'Simulación local',
  protected_mode_warning:true
 },
 models:[
  {id:'direct_seller',name:'Pago directo al vendedor',description:'El cliente paga por Yape, Plin, transferencia, tarjeta o efectivo directamente al negocio.',enabled:true,public:true,risk:'medio',requires_provider:false,commission_percent:0},
  {id:'cash_delivery',name:'Pago contra entrega',description:'El cliente paga al recibir el producto o al finalizar el servicio.',enabled:true,public:true,risk:'medio',requires_provider:false,commission_percent:0},
  {id:'payment_link',name:'Enlace o QR de pago',description:'MiZona muestra un enlace o QR emitido por el vendedor o una pasarela autorizada.',enabled:true,public:true,risk:'medio',requires_provider:true,commission_percent:3.5},
  {id:'platform_checkout',name:'Cobro dentro de MiZona',description:'El cliente paga dentro de MiZona mediante una pasarela conectada.',enabled:false,public:false,risk:'bajo',requires_provider:true,commission_percent:8},
  {id:'protected_payment',name:'Pago protegido',description:'El pago queda pendiente de liberación hasta confirmar entrega o resolver un reclamo.',enabled:false,public:false,risk:'bajo',requires_provider:true,commission_percent:10},
  {id:'split_payment',name:'Pago dividido automático',description:'Una pasarela marketplace distribuye comisión y saldo del vendedor.',enabled:false,public:false,risk:'bajo',requires_provider:true,commission_percent:8}
 ],
 transactions:[
  {id:'PAY-22001',buyer:'Valery',seller:'Pollería Mi Zona',concept:'Pedido familiar',amount:89.9,model:'direct_seller',status:'completed',created_at:now()},
  {id:'PAY-22002',buyer:'José',seller:'Técnico Carlos',concept:'Reserva de servicio',amount:120,model:'protected_payment',status:'held',created_at:now()}
 ],
 audit:[]
};
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&x.version===22?x:structuredClone(defaults);}catch{return structuredClone(defaults)}}
function write(state,action='update'){state.updated_at=now();state.audit=[{id:id('audit'),action,created_at:now()},...(state.audit||[])].slice(0,100);localStorage.setItem(KEY,JSON.stringify(state));try{new BroadcastChannel(CHANNEL).postMessage({type:'changed'})}catch{};window.dispatchEvent(new CustomEvent('mizona-payments-changed'));return state}
export const getPaymentsState=()=>read();
export function subscribePayments(cb){const handler=()=>cb(read());window.addEventListener('storage',handler);window.addEventListener('mizona-payments-changed',handler);let ch;try{ch=new BroadcastChannel(CHANNEL);ch.onmessage=handler}catch{};return()=>{window.removeEventListener('storage',handler);window.removeEventListener('mizona-payments-changed',handler);ch?.close()}}
export function updatePaymentSettings(patch){const s=read();s.settings={...s.settings,...patch};return write(s,'payment_settings_updated')}
export function updatePaymentModel(modelId,patch){const s=read();s.models=s.models.map(m=>m.id===modelId?{...m,...patch}:m);if(patch.enabled===false&&s.settings.default_model===modelId){s.settings.default_model=s.models.find(m=>m.enabled)?.id||'direct_seller'}return write(s,`payment_model_${modelId}_updated`)}
export function setDefaultPaymentModel(modelId){const s=read();const model=s.models.find(m=>m.id===modelId);if(!model?.enabled)throw new Error('Primero debes activar este modelo.');s.settings.default_model=modelId;return write(s,`default_payment_${modelId}`)}
export function createDemoPayment({buyer,seller,concept,amount,model}){const s=read();const selected=s.models.find(m=>m.id===model);if(!selected?.enabled)throw new Error('El modelo seleccionado está desactivado.');const value=Number(amount);if(!Number.isFinite(value)||value<s.settings.minimum_amount||value>s.settings.maximum_amount)throw new Error(`El monto debe estar entre S/${s.settings.minimum_amount} y S/${s.settings.maximum_amount}.`);const commission=+(value*(Number(selected.commission_percent||0)/100)+Number(s.settings.fixed_fee||0)).toFixed(2);const status=['protected_payment','platform_checkout','split_payment'].includes(model)?'held':'pending';const tx={id:`PAY-${Date.now().toString().slice(-8)}`,buyer:buyer||'Cliente local',seller:seller||'Vendedor local',concept:concept||'Compra o servicio',amount:value,commission,net:+(value-commission).toFixed(2),model,status,created_at:now()};s.transactions=[tx,...s.transactions];write(s,'demo_payment_created');return tx}
export function updateDemoPayment(id,status){const s=read();s.transactions=s.transactions.map(t=>t.id===id?{...t,status,updated_at:now()}:t);return write(s,`payment_${status}`)}
export function resetPayments(){localStorage.removeItem(KEY);return write(structuredClone(defaults),'payments_reset')}
export function downloadPaymentsReport(){const s=read();const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mizona-pagos-etapa22.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
