import { hasSupabase, supabase } from './supabase';
const nowIso=()=>new Date().toISOString();
function requireCloud(){if(!hasSupabase||!supabase)throw new Error('Supabase no está configurado.');if(!navigator.onLine)throw new Error('No hay conexión a Internet.');}
async function userId(){const {data}=await supabase.auth.getUser();return data?.user?.id||null;}
export async function syncRideSnapshot(snapshot){
  requireCloud(); const uid=await userId(); if(!uid)throw new Error('Inicia sesión para sincronizar Ride.');
  const drivers=(snapshot?.state?.drivers||[]).filter(r=>r.user_id===snapshot.profile.id).map(r=>({
    id:String(r.id),user_id:uid,local_user_id:r.user_id,service_types:['ride','delivery'],vehicle_type:r.vehicle_type||'moto',
    vehicle_brand:r.vehicle_brand||'',vehicle_model:r.vehicle_model||'',vehicle_color:r.color||'',plate:r.plate||'',license_number:r.license_number||'',
    verification_status:r.status||'pending',documents_ok:Boolean(r.documents_ok),online:Boolean(r.online),rating:Number(r.rating||5),trips_completed:Number(r.trips_completed||0),updated_at:nowIso()
  }));
  const rides=(snapshot?.state?.rides||[]).filter(r=>r.passenger_id===snapshot.profile.id).map(r=>({
    id:String(r.id),code:r.code,passenger_user_id:uid,local_passenger_id:r.passenger_id,driver_id:r.driver_id||null,service_type:r.service_type||'auto',
    origin_label:r.origin,destination_label:r.destination,distance_km:Number(r.distance_km||0),duration_min:Number(r.duration_min||0),fare:Number(r.fare||0),payment_method:r.payment_method||'cash',
    status:r.status||'searching',security_code:r.security_code||null,rating:r.rating||null,rating_comment:r.rating_comment||'',created_at:r.created_at||nowIso(),accepted_at:r.accepted_at||null,started_at:r.started_at||null,completed_at:r.completed_at||null,updated_at:nowIso()
  }));
  const deliveries=(snapshot?.state?.deliveries||[]).filter(r=>r.customer_id===snapshot.profile.id).map(r=>({
    id:String(r.id),code:r.code,customer_user_id:uid,local_customer_id:r.customer_id,driver_id:r.driver_id||null,pickup_label:r.pickup,dropoff_label:r.dropoff,package_type:r.package_type||'package',content:r.content||'',recipient_name:r.recipient_name||'',recipient_phone:r.recipient_phone||'',distance_km:Number(r.distance_km||0),fare:Number(r.fare||0),payment_method:r.payment_method||'cash',status:r.status||'searching',proof_note:r.proof_note||'',created_at:r.created_at||nowIso(),accepted_at:r.accepted_at||null,picked_up_at:r.picked_up_at||null,delivered_at:r.delivered_at||null,updated_at:nowIso()
  }));
  for(const [table,rows] of [['mz_ride_drivers',drivers],['mz_ride_requests',rides],['mz_delivery_requests',deliveries]]){if(rows.length){const {error}=await supabase.from(table).upsert(rows,{onConflict:'id'});if(error)throw error;}}
  return {drivers:drivers.length,rides:rides.length,deliveries:deliveries.length,synced_at:nowIso()};
}
export async function loadRideCloudSummary(){
  requireCloud(); const uid=await userId(); if(!uid)return {drivers:0,rides:0,deliveries:0};
  const driverIds=(await supabase.from('mz_ride_drivers').select('id').eq('user_id',uid)).data?.map(r=>r.id)||[];
  const [r,d]=await Promise.all([
    supabase.from('mz_ride_requests').select('id',{count:'exact',head:true}).or(`passenger_user_id.eq.${uid}${driverIds.length?`,driver_id.in.(${driverIds.join(',')})`:''}`),
    supabase.from('mz_delivery_requests').select('id',{count:'exact',head:true}).or(`customer_user_id.eq.${uid}${driverIds.length?`,driver_id.in.(${driverIds.join(',')})`:''}`)
  ]);
  const error=r.error||d.error;if(error)throw error;return {drivers:driverIds.length,rides:r.count||0,deliveries:d.count||0};
}
export function subscribeCloudRide(onChange){if(!hasSupabase||!supabase)return()=>{};const ch=supabase.channel(`mizona-ride-${Date.now()}`).on('postgres_changes',{event:'*',schema:'public',table:'mz_ride_requests'},onChange).on('postgres_changes',{event:'*',schema:'public',table:'mz_delivery_requests'},onChange).on('postgres_changes',{event:'*',schema:'public',table:'mz_ride_locations'},onChange).subscribe();return()=>supabase.removeChannel(ch);}
