import { hasSupabase, supabase } from './supabase';

const nowIso = () => new Date().toISOString();

function requireCloud(){
  if(!hasSupabase || !supabase) throw new Error('Supabase no está configurado.');
  if(!navigator.onLine) throw new Error('No hay conexión a Internet.');
}

async function currentUserId(){
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

const clean = value => value == null ? null : value;

export async function syncBusinessOperations(snapshot){
  requireCloud();
  if(!snapshot?.business?.id) throw new Error('No se encontró el negocio activo.');
  const userId = await currentUserId();
  if(!userId) throw new Error('Inicia sesión para sincronizar las operaciones del negocio.');
  const businessId = String(snapshot.business.id);

  const workers = (snapshot.workers||[]).map(row=>({
    id:String(row.id), business_id:businessId,
    user_id:row.user_id===snapshot.business.owner_id ? userId : null,
    local_user_id:String(row.user_id||''), role:row.role, status:row.status||'active',
    created_at:row.created_at||nowIso(), updated_at:nowIso()
  }));
  const customers = (snapshot.customers||[]).map(row=>({
    id:String(row.id), business_id:businessId, name:row.name, phone:row.phone||'', email:row.email||'',
    visits:Number(row.visits||0), total_spent:Number(row.total_spent||0), points:Number(row.points||0),
    notes:row.notes||'', created_at:row.created_at||nowIso(), updated_at:nowIso()
  }));
  const sessions = (snapshot.cash_sessions||[]).map(row=>({
    id:String(row.id), business_id:businessId,
    user_id:row.user_id===snapshot.business.owner_id ? userId : null,
    local_user_id:String(row.user_id||''), opening_amount:Number(row.opening_amount||0),
    counted_amount:clean(row.counted_amount), expected_amount:clean(row.expected_amount), difference:clean(row.difference),
    status:row.status||'open', opened_at:row.opened_at||nowIso(), closed_at:clean(row.closed_at), updated_at:nowIso()
  }));
  const sales = (snapshot.sales||[]).map(row=>({
    id:String(row.id), business_id:businessId, order_id:row.order_id||null, customer_id:row.customer_id||null,
    cash_session_id:row.cash_session_id||null, cashier_user_id:row.cashier_id===snapshot.business.owner_id ? userId : null,
    local_cashier_id:String(row.cashier_id||''), receipt:row.receipt, payment_method:row.payment_method||'cash',
    subtotal:Number(row.subtotal||0), tax:Number(row.tax||0), total:Number(row.total||0),
    cash_received:Number(row.cash_received||0), change_amount:Number(row.change||0),
    metadata:{source:'mizona-business-local'}, created_at:row.created_at||nowIso(), updated_at:nowIso()
  }));
  const saleItems = [];
  for(const sale of snapshot.sales||[]){
    const order=(snapshot.orders||[]).find(item=>item.id===sale.order_id);
    for(const item of order?.items||[]){
      saleItems.push({sale_id:String(sale.id), product_id:item.product_id||null, name:item.name,
        quantity:Number(item.qty||1), unit_price:Number(item.price||0), line_total:Number(item.qty||1)*Number(item.price||0),
        metadata:{kitchen:Boolean(item.kitchen)}});
    }
  }
  const expenses = (snapshot.expenses||[]).map(row=>({
    id:String(row.id), business_id:businessId, cash_session_id:row.cash_session_id||null,
    created_by:row.created_by===snapshot.business.owner_id ? userId : null, local_created_by:String(row.created_by||''),
    category:row.category||'Otros', description:row.description||'', amount:Number(row.amount||0),
    payment_method:row.payment_method||'cash', created_at:row.created_at||nowIso(), updated_at:nowIso()
  }));
  const inventory = (snapshot.inventory_movements||[]).map(row=>({
    id:String(row.id), business_id:businessId, product_id:String(row.product_id),
    user_id:row.user_id===snapshot.business.owner_id ? userId : null, local_user_id:String(row.user_id||''),
    quantity:Number(row.quantity||0), reason:row.reason||'', reference_type:'local_sync',
    created_at:row.created_at||nowIso()
  }));

  const batches = [
    ['mz_business_workers',workers],['mz_business_customers',customers],['mz_cash_sessions',sessions],
    ['mz_business_sales',sales],['mz_business_expenses',expenses],['mz_inventory_movements',inventory]
  ];
  for(const [table,rows] of batches){
    if(!rows.length) continue;
    const { error } = await supabase.from(table).upsert(rows,{onConflict:'id'});
    if(error) throw error;
  }
  if(saleItems.length){
    const saleIds=[...new Set(saleItems.map(item=>item.sale_id))];
    const { error:deleteError }=await supabase.from('mz_business_sale_items').delete().in('sale_id',saleIds);
    if(deleteError) throw deleteError;
    const { error:itemError }=await supabase.from('mz_business_sale_items').insert(saleItems);
    if(itemError) throw itemError;
  }
  return {
    workers:workers.length, customers:customers.length, sessions:sessions.length,
    sales:sales.length, saleItems:saleItems.length, expenses:expenses.length, inventory:inventory.length,
    synced_at:nowIso()
  };
}

export async function loadBusinessOperationsSummary(businessId){
  requireCloud();
  const id=String(businessId);
  const requests = await Promise.all([
    supabase.from('mz_business_workers').select('id',{count:'exact',head:true}).eq('business_id',id),
    supabase.from('mz_business_customers').select('id',{count:'exact',head:true}).eq('business_id',id),
    supabase.from('mz_cash_sessions').select('id',{count:'exact',head:true}).eq('business_id',id),
    supabase.from('mz_business_sales').select('id,total',{count:'exact'}).eq('business_id',id),
    supabase.from('mz_business_expenses').select('id,amount',{count:'exact'}).eq('business_id',id),
    supabase.from('mz_inventory_movements').select('id',{count:'exact',head:true}).eq('business_id',id)
  ]);
  const error=requests.find(item=>item.error)?.error;
  if(error) throw error;
  const sales=requests[3].data||[];
  const expenses=requests[4].data||[];
  return {
    workers:requests[0].count||0, customers:requests[1].count||0, sessions:requests[2].count||0,
    sales:requests[3].count||sales.length, sales_total:sales.reduce((sum,row)=>sum+Number(row.total||0),0),
    expenses:requests[4].count||expenses.length, expenses_total:expenses.reduce((sum,row)=>sum+Number(row.amount||0),0),
    inventory:requests[5].count||0
  };
}

export function subscribeBusinessOperations(businessId,onChange){
  if(!hasSupabase||!supabase||!businessId) return ()=>{};
  const id=String(businessId);
  const channel=supabase.channel(`mizona-business-ops-${id}-${Date.now()}`);
  ['mz_business_workers','mz_business_customers','mz_cash_sessions','mz_business_sales','mz_business_expenses','mz_inventory_movements']
    .forEach(table=>channel.on('postgres_changes',{event:'*',schema:'public',table,filter:`business_id=eq.${id}`},onChange));
  channel.subscribe();
  return ()=>supabase.removeChannel(channel);
}
