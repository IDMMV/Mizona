import { supabase } from './supabase';
async function uid(){const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Inicia sesión');return user.id;}
export async function blockUser(blockedId){const me=await uid();const {error}=await supabase.from('mz_blocks').upsert({blocker_id:me,blocked_id:blockedId});if(error)throw error;return true;}
export async function reportEntity(target_type,target_id,reason,detail=''){const me=await uid();const {data,error}=await supabase.from('mz_reports').insert({reporter_id:me,target_type,target_id,reason,detail}).select().single();if(error)throw error;return data;}
export async function requestAccountDeletion(reason=''){const me=await uid();const {data,error}=await supabase.from('mz_account_deletion_requests').insert({user_id:me,reason}).select().single();if(error)throw error;return data;}
