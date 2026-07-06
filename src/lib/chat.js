import { hasSupabase, normalizeUsername, supabase } from './supabase';

const now = Date.now();
const iso = value => new Date(value).toISOString();

export const demoContacts = [
  { id: 'demo-valery', username: 'VALERY_H', display_name: 'Valery', account_type: 'adult', zone: 'Ventanilla', connected_at: iso(now - 86400000 * 20) },
  { id: 'demo-ian', username: 'IAN_H', display_name: 'Ian', account_type: 'student', zone: 'Pachacútec', connected_at: iso(now - 86400000 * 7) },
  { id: 'demo-dylan', username: 'DYLAN_V', display_name: 'Dylan', account_type: 'student', zone: 'Pachacútec', connected_at: iso(now - 86400000 * 3) }
];

export const demoRequests = [
  { id: 'request-1', direction: 'received', status: 'pending', other_user_id: 'demo-maria', username: 'MARIA_P', display_name: 'María P.', account_type: 'adult', updated_at: iso(now - 3600000) },
  { id: 'request-2', direction: 'sent', status: 'pending', other_user_id: 'demo-luis', username: 'LUIS_2026', display_name: 'Luis', account_type: 'adult', updated_at: iso(now - 7200000) }
];

export const demoConversations = [
  { id: 'conv-family', type: 'group', title: 'Familia Hugo', retention_days: 7, last_message_at: iso(now - 300000), unread_count: 2, last_message: 'Nos vemos a las 6:00 p. m.' },
  { id: 'conv-ian', type: 'direct', title: null, peer_id: 'demo-ian', peer_username: 'IAN_H', peer_display_name: 'Ian', retention_days: 7, last_message_at: iso(now - 1800000), unread_count: 0, last_message: 'Ya envié la tarea.' },
  { id: 'conv-school', type: 'school_room', title: '5.º A · Ciencia', retention_days: 7, last_message_at: iso(now - 7200000), unread_count: 4, last_message: 'Adjunto la guía de laboratorio.' }
];

const demoMessages = {
  'conv-family': [
    { id: 'm1', sender_id: 'demo-valery', sender_username: 'VALERY_H', sender_display_name: 'Valery', body: '¿A qué hora salimos?', message_type: 'text', created_at: iso(now - 1800000), expires_at: iso(now + 86400000 * 6), attachments: [] },
    { id: 'm2', sender_id: null, sender_username: 'JOSE1985', sender_display_name: 'José', body: 'Nos vemos a las 6:00 p. m.', message_type: 'text', created_at: iso(now - 300000), expires_at: iso(now + 86400000 * 7), attachments: [] }
  ],
  'conv-ian': [
    { id: 'm3', sender_id: 'demo-ian', sender_username: 'IAN_H', sender_display_name: 'Ian', body: 'Ya envié la tarea.', message_type: 'text', created_at: iso(now - 1800000), expires_at: iso(now + 86400000 * 6), attachments: [] }
  ],
  'conv-school': [
    { id: 'm4', sender_id: 'teacher', sender_username: 'PROFE_ANA', sender_display_name: 'Profesora Ana', body: 'Adjunto la guía de laboratorio.', message_type: 'file', created_at: iso(now - 7200000), expires_at: iso(now + 86400000 * 5), attachments: [{ id: 'a1', file_name: 'guia_laboratorio.pdf', mime_type: 'application/pdf', size_bytes: 284000 }] }
  ]
};

function requireBackend() {
  if (!hasSupabase || !supabase) throw new Error('Supabase todavía no está configurado en Vercel.');
}

function safeFileName(name) {
  const raw = String(name || 'archivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'archivo';
}

export async function findChatProfileExact(username) {
  if (!hasSupabase) {
    const normalized = normalizeUsername(username).toUpperCase();
    return demoContacts.find(item => item.username === normalized) || null;
  }
  const { data, error } = await supabase.rpc('mz_chat_find_profile_exact', { p_username: normalizeUsername(username) });
  if (error) throw error;
  return data?.[0] || null;
}

export async function loadChatContacts() {
  if (!hasSupabase) return demoContacts;
  const { data, error } = await supabase.rpc('mz_chat_list_contacts');
  if (error) throw error;
  return data || [];
}

export async function loadChatRequests() {
  if (!hasSupabase) return demoRequests;
  const { data, error } = await supabase.rpc('mz_chat_list_requests');
  if (error) throw error;
  return data || [];
}

export async function sendContactRequest(username) {
  if (!hasSupabase) return `demo-${Date.now()}`;
  const { data, error } = await supabase.rpc('mz_chat_send_contact_request', { p_username: normalizeUsername(username) });
  if (error) throw error;
  return data;
}

export async function reviewContactRequest(id, action) {
  if (!hasSupabase) return action;
  const { data, error } = await supabase.rpc('mz_chat_review_contact_request', { p_request_id: id, p_action: action });
  if (error) throw error;
  return data;
}

export async function blockChatUser(userId, reason = '') {
  if (!hasSupabase) return true;
  const { data, error } = await supabase.rpc('mz_chat_block_user', { p_target: userId, p_reason: reason || null });
  if (error) throw error;
  return data;
}

export async function unblockChatUser(userId) {
  if (!hasSupabase) return true;
  const { data, error } = await supabase.rpc('mz_chat_unblock_user', { p_target: userId });
  if (error) throw error;
  return data;
}

export async function loadConversations() {
  if (!hasSupabase) return demoConversations;
  const { data, error } = await supabase.rpc('mz_chat_list_conversations');
  if (error) throw error;
  return data || [];
}

export async function loadMessages(conversationId) {
  if (!hasSupabase) return demoMessages[conversationId] || [];
  const { data, error } = await supabase.rpc('mz_chat_list_messages', { p_conversation_id: conversationId, p_limit: 150 });
  if (error) throw error;
  return data || [];
}

export async function startDirectConversation(targetId) {
  if (!hasSupabase) return `demo-direct-${targetId}`;
  const { data, error } = await supabase.rpc('mz_chat_start_direct', { p_target: targetId });
  if (error) throw error;
  return data;
}

export async function createChatGroup({ title, memberIds = [], communityId = null, roomId = null }) {
  if (!hasSupabase) return `demo-group-${Date.now()}`;
  const { data, error } = await supabase.rpc('mz_chat_create_group', {
    p_title: String(title || '').trim(),
    p_member_ids: memberIds,
    p_community_id: communityId,
    p_room_id: roomId
  });
  if (error) throw error;
  return data;
}

export async function sendTextMessage(conversationId, body, replyTo = null) {
  if (!hasSupabase) return `demo-message-${Date.now()}`;
  const { data, error } = await supabase.rpc('mz_chat_send_message', {
    p_conversation_id: conversationId,
    p_body: String(body || '').trim(),
    p_message_type: 'text',
    p_reply_to: replyTo
  });
  if (error) throw error;
  return data;
}

export async function sendChatFile({ conversationId, file, userId }) {
  requireBackend();
  if (!file) throw new Error('Selecciona un archivo.');
  if (file.size > 25 * 1024 * 1024) throw new Error('El archivo supera el máximo de 25 MB.');

  const isImage = String(file.type || '').startsWith('image/');
  const { data: messageId, error: messageError } = await supabase.rpc('mz_chat_send_message', {
    p_conversation_id: conversationId,
    p_body: file.name,
    p_message_type: isImage ? 'image' : 'file',
    p_reply_to: null
  });
  if (messageError) throw messageError;

  const path = `${conversationId}/${userId}/${messageId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from('chat-files').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'application/octet-stream',
    upsert: false
  });

  if (uploadError) {
    await supabase.from('mz_chat_messages').delete().eq('id', messageId);
    throw uploadError;
  }

  const { error: metadataError } = await supabase.from('mz_chat_attachments').insert({
    message_id: messageId,
    conversation_id: conversationId,
    uploader_id: userId,
    file_name: file.name,
    storage_path: path,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size
  });

  if (metadataError) {
    await supabase.storage.from('chat-files').remove([path]);
    await supabase.from('mz_chat_messages').delete().eq('id', messageId);
    throw metadataError;
  }

  return messageId;
}

export async function openChatAttachment(storagePath) {
  requireBackend();
  const { data, error } = await supabase.storage.from('chat-files').createSignedUrl(storagePath, 120);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('No fue posible preparar la descarga.');
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export async function markConversationRead(conversationId) {
  if (!hasSupabase) return true;
  const { data, error } = await supabase.rpc('mz_chat_mark_read', { p_conversation_id: conversationId });
  if (error) throw error;
  return data;
}

export async function leaveConversation(conversationId) {
  if (!hasSupabase) return true;
  const { data, error } = await supabase.rpc('mz_chat_leave_conversation', { p_conversation_id: conversationId });
  if (error) throw error;
  return data;
}

export async function reportChatItem({ conversationId, messageId = null, reportedUserId = null, reason, details = '', reporterId }) {
  if (!hasSupabase) return true;
  const { error } = await supabase.from('mz_chat_reports').insert({
    reporter_id: reporterId,
    conversation_id: conversationId,
    message_id: messageId,
    reported_user_id: reportedUserId,
    reason,
    details: details || null
  });
  if (error) throw error;
  return true;
}

export function subscribeToChat({ userId, conversationId, onConversationChange, onMessageChange, onRequestChange }) {
  if (!hasSupabase || !supabase || !userId) return () => {};
  const channels = [];

  const memberChannel = supabase
    .channel(`mz-chat-members-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_conversation_members', filter: `user_id=eq.${userId}` }, payload => onConversationChange?.(payload))
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.error('Chat members realtime', status, error);
    });
  channels.push(memberChannel);

  const requestChannel = supabase
    .channel(`mz-chat-requests-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_contact_requests' }, payload => onRequestChange?.(payload))
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.error('Chat requests realtime', status, error);
    });
  channels.push(requestChannel);

  if (conversationId) {
    const messageChannel = supabase
      .channel(`mz-chat-messages-${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_chat_messages', filter: `conversation_id=eq.${conversationId}` }, payload => onMessageChange?.(payload))
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.error('Chat messages realtime', status, error);
      });
    channels.push(messageChannel);
  }

  return () => channels.forEach(channel => supabase.removeChannel(channel));
}
