import { hasSupabase, supabase } from './supabase';

const nowIso = () => new Date().toISOString();
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

async function cloudUserId(){
  if(!hasSupabase || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

function requireCloud(){
  if(!hasSupabase || !supabase) throw new Error('Supabase no está configurado.');
  if(!navigator.onLine) throw new Error('No hay conexión a Internet.');
}

export async function listCloudCommerce(){
  requireCloud();
  const [businesses, products, listings] = await Promise.all([
    supabase.from('mz_businesses').select('*').eq('status','active').order('created_at',{ascending:false}),
    supabase.from('mz_products').select('*').eq('active',true).order('created_at',{ascending:false}),
    supabase.from('mz_marketplace_listings').select('*').in('status',['active']).order('created_at',{ascending:false})
  ]);
  const error = businesses.error || products.error || listings.error;
  if(error) throw error;
  return { businesses:businesses.data||[], products:products.data||[], listings:listings.data||[] };
}

export async function upsertCloudBusiness(row){
  requireCloud();
  const userId = await cloudUserId();
  if(!userId) throw new Error('Inicia sesión para sincronizar el negocio.');
  const payload = {
    id:String(row.id), owner_user_id:userId, local_owner_id:row.owner_id||row.local_owner_id||null,
    name:String(row.name||'').trim(), trade_name:row.trade_name||null, category:row.category||'other',
    description:row.description||'', zone:row.zone||'', address:row.address||'', phone:row.phone||'',
    hours:row.hours||'', emoji:row.emoji||'🏪', status:row.status==='active'?'active':'pending',
    verified:Boolean(row.verified), open_now:row.open!==false, delivery_enabled:Boolean(row.delivery_enabled||row.delivery),
    metadata:{ affiliated:Boolean(row.affiliated), claimed:Boolean(row.claimed), badges:row.badges||[] },
    updated_at:nowIso()
  };
  const { data,error } = await supabase.from('mz_businesses').upsert(payload,{onConflict:'id'}).select().single();
  if(error) throw error; return data;
}

export async function upsertCloudProduct(row){
  requireCloud();
  const payload = {
    id:String(row.id), business_id:String(row.business_id), name:String(row.name||'').trim(),
    description:row.description||'', category:row.category||'', price:Number(row.price||0), stock:Number(row.stock||0),
    minimum_stock:Number(row.minimum||row.minimum_stock||0), unit:row.unit||'unid.', image_url:row.image_url||null,
    emoji:row.emoji||'📦', active:row.active!==false, track_stock:row.track_stock!==false,
    kitchen:Boolean(row.kitchen), metadata:row.metadata||{}, updated_at:nowIso()
  };
  const { data,error } = await supabase.from('mz_products').upsert(payload,{onConflict:'id'}).select().single();
  if(error) throw error; return data;
}

export async function upsertCloudListing(row){
  requireCloud();
  const userId = await cloudUserId();
  if(!userId) throw new Error('Inicia sesión para publicar en la nube.');
  const payload = {
    id:String(row.id), seller_user_id:userId, local_seller_id:row.seller_id||null,
    business_id:row.business_id||null, product_id:row.product_id||null, category:row.category||'other',
    title:String(row.title||'').trim(), description:row.description||'', price:Number(row.price||0),
    condition_label:row.condition||row.condition_label||'', zone:row.zone||'', image_url:row.image_url||null,
    emoji:row.image||row.emoji||'📦', delivery:Boolean(row.delivery), negotiable:Boolean(row.negotiable),
    verified:Boolean(row.verified), status:['active','paused','sold','rejected'].includes(row.status)?row.status:'pending',
    views:Number(row.views||0), contact_count:Number(row.contact_count||0),
    metadata:{ image_data:row.image_data||null, tags:row.tags||[] }, updated_at:nowIso()
  };
  const { data,error } = await supabase.from('mz_marketplace_listings').upsert(payload,{onConflict:'id'}).select().single();
  if(error) throw error; return data;
}

export async function createCloudOrder({ businessId, sellerUserId=null, localSellerId=null, localBuyerId=null, source='marketplace', orderType='pickup', customerName='', customerPhone='', deliveryAddress='', notes='', items=[] }){
  requireCloud();
  const buyerUserId = await cloudUserId();
  if(!buyerUserId) throw new Error('Inicia sesión para registrar el pedido.');
  if(!businessId) throw new Error('El pedido necesita un negocio proveedor.');
  if(!Array.isArray(items) || !items.length) throw new Error('El pedido está vacío.');
  const subtotal = items.reduce((sum,item)=>sum + Number(item.quantity||item.qty||1)*Number(item.unit_price||item.price||0),0);
  const deliveryFee = Number(items.delivery_fee||0);
  const order = {
    id:uid('ord'), code:`MZ-${Date.now().toString().slice(-8)}`, business_id:String(businessId),
    buyer_user_id:buyerUserId, local_buyer_id:localBuyerId, seller_user_id:sellerUserId,
    local_seller_id:localSellerId, source, order_type:orderType, status:'pending', customer_name:customerName,
    customer_phone:customerPhone, delivery_address:deliveryAddress, subtotal, delivery_fee:deliveryFee,
    tax:0, total:subtotal+deliveryFee, notes, updated_at:nowIso()
  };
  const { error:orderError } = await supabase.from('mz_orders').insert(order);
  if(orderError) throw orderError;
  const rows = items.map(item=>({
    order_id:order.id, product_id:item.product_id||null, listing_id:item.listing_id||item.id||null,
    name:item.name||item.title||'Producto', quantity:Number(item.quantity||item.qty||1),
    unit_price:Number(item.unit_price||item.price||0), metadata:item.metadata||{}
  }));
  const { error:itemError } = await supabase.from('mz_order_items').insert(rows);
  if(itemError){ await supabase.from('mz_orders').delete().eq('id',order.id); throw itemError; }
  return {...order,items:rows};
}

export async function listMyCloudOrders(){
  requireCloud();
  const userId = await cloudUserId();
  if(!userId) return [];
  const { data,error } = await supabase.from('mz_orders').select('*,mz_order_items(*)').or(`buyer_user_id.eq.${userId},seller_user_id.eq.${userId}`).order('created_at',{ascending:false});
  if(error) throw error; return data||[];
}

export async function updateCloudOrderStatus(orderId,status){
  requireCloud();
  const allowed=['confirmed','preparing','ready','delivering','delivered','cancelled','rejected'];
  if(!allowed.includes(status)) throw new Error('Estado de pedido inválido.');
  const { data,error } = await supabase.from('mz_orders').update({status,updated_at:nowIso()}).eq('id',orderId).select().single();
  if(error) throw error; return data;
}

export function mapCloudListing(row){
  return {
    ...row,
    seller_id: row.local_seller_id || row.seller_user_id,
    seller_username: row.metadata?.seller_username || 'VENDEDOR MIZONA',
    image: row.emoji || '📦',
    image_data: row.metadata?.image_data || row.image_url || null,
    condition: row.condition_label || 'Nuevo',
    distance_km: Number(row.metadata?.distance_km || 1),
    is_cloud: true,
    provider_business_id: row.business_id || null,
    provider: row.metadata?.provider_name || row.metadata?.seller_username || 'Proveedor MiZona'
  };
}

export function mapCloudBusiness(row){
  return {
    ...row,
    owner_id: row.local_owner_id || row.owner_user_id,
    open: row.open_now,
    affiliated: Boolean(row.metadata?.affiliated),
    claimed: Boolean(row.metadata?.claimed),
    badges: row.metadata?.badges || [],
    distance_km: Number(row.metadata?.distance_km || 1),
    delivery: row.delivery_enabled,
    is_cloud: true
  };
}

export function mapCloudOrder(row){
  const statusMap = {
    pending:'registrado', confirmed:'aceptado', preparing:'preparando', ready:'preparando',
    delivering:'en_camino', delivered:'entregado', cancelled:'cancelado', rejected:'cancelado'
  };
  return {
    ...row,
    status: statusMap[row.status] || row.status,
    cloud_status: row.status,
    provider: row.metadata?.provider_name || row.business_name || 'Negocio MiZona',
    deliveryMode: row.order_type === 'delivery' ? 'Delivery' : row.order_type === 'table' ? 'Mesa' : 'Recojo en tienda',
    items: (row.mz_order_items || row.items || []).map(item=>({
      id:item.id || item.listing_id || item.product_id,
      listing_id:item.listing_id,
      product_id:item.product_id,
      title:item.name,
      name:item.name,
      qty:Number(item.quantity || 1),
      quantity:Number(item.quantity || 1),
      price:Number(item.unit_price || 0),
      unit_price:Number(item.unit_price || 0),
      image:item.metadata?.emoji || '📦',
      image_data:item.metadata?.image_data || null
    })),
    is_cloud:true
  };
}

export async function loadCloudMarketplace(){
  const data = await listCloudCommerce();
  return {
    businesses:(data.businesses||[]).map(mapCloudBusiness),
    products:data.products||[],
    listings:(data.listings||[]).map(mapCloudListing)
  };
}

export async function loadMyCloudOrders(){
  const rows = await listMyCloudOrders();
  return rows.map(mapCloudOrder);
}

export async function loadCloudOrdersForBusiness(businessId){
  requireCloud();
  const { data,error } = await supabase.from('mz_orders').select('*,mz_order_items(*)').eq('business_id',String(businessId)).order('created_at',{ascending:false});
  if(error) throw error;
  return (data||[]).map(mapCloudOrder);
}

export async function updateCloudOrderFromUi(orderId, uiStatus){
  const map = {aceptado:'confirmed',preparando:'preparing',en_camino:'delivering',entregado:'delivered',cancelado:'cancelled'};
  return updateCloudOrderStatus(orderId,map[uiStatus]||uiStatus);
}

export function subscribeCloudCommerce(onChange){
  if(!hasSupabase || !supabase) return ()=>{};
  const channel = supabase.channel(`mizona-commerce-${Date.now()}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'mz_businesses'},onChange)
    .on('postgres_changes',{event:'*',schema:'public',table:'mz_products'},onChange)
    .on('postgres_changes',{event:'*',schema:'public',table:'mz_marketplace_listings'},onChange)
    .on('postgres_changes',{event:'*',schema:'public',table:'mz_orders'},onChange)
    .subscribe();
  return ()=>{ supabase.removeChannel(channel); };
}
