import { hasSupabase, normalizeUsername, supabase } from './supabase';
import {
  blockLocalUser,
  createLocalGroup,
  findLocalProfileExact,
  getLocalChatContacts,
  getLocalChatRequests,
  getLocalConversations,
  getLocalMessages,
  isLocalDataMode,
  leaveLocalConversation,
  markLocalConversationRead,
  openLocalAttachment,
  reportLocalChatItem,
  reviewLocalContactRequest,
  sendLocalChatFile,
  sendLocalContactRequest,
  sendLocalTextMessage,
  startLocalDirectConversation,
  subscribeLocalData,
  unblockLocalUser
} from './localStore';

export const demoContacts = getLocalChatContacts();
export const demoRequests = getLocalChatRequests();
export const demoConversations = getLocalConversations();

function useLocal() {
  return isLocalDataMode() || !hasSupabase || !supabase;
}

function safeFileName(name) {
  const raw = String(name || 'archivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'archivo';
}

export async function findChatProfileExact(username) {
  if (useLocal()) return findLocalProfileExact(username);
  const { data, error } = await supabase.rpc('mz_chat_find_profile_exact', { p_username: normalizeUsername(username) });
  if (error) throw error;
  return data?.[0] || null;
}

export async function loadChatContacts() {
  if (useLocal()) return getLocalChatContacts();
  const { data, error } = await supabase.rpc('mz_chat_list_contacts');
  if (error) throw error;
  return data || [];
}

export async function loadChatRequests() {
  if (useLocal()) return getLocalChatRequests();
  const { data, error } = await supabase.rpc('mz_chat_list_requests');
  if (error) throw error;
  return data || [];
}

export async function sendContactRequest(username) {
  if (useLocal()) return sendLocalContactRequest(username);
  const { data, error } = await supabase.rpc('mz_chat_send_contact_request', { p_username: normalizeUsername(username) });
  if (error) throw error;
  return data;
}

export async function reviewContactRequest(id, action) {
  if (useLocal()) return reviewLocalContactRequest(id, action);
  const { data, error } = await supabase.rpc('mz_chat_review_contact_request', { p_request_id: id, p_action: action });
  if (error) throw error;
  return data;
}

export async function blockChatUser(userId, reason = '') {
  if (useLocal()) return blockLocalUser(userId, reason);
  const { data, error } = await supabase.rpc('mz_chat_block_user', { p_target: userId, p_reason: reason || null });
  if (error) throw error;
  return data;
}

export async function unblockChatUser(userId) {
  if (useLocal()) return unblockLocalUser(userId);
  const { data, error } = await supabase.rpc('mz_chat_unblock_user', { p_target: userId });
  if (error) throw error;
  return data;
}

export async function loadConversations() {
  if (useLocal()) return getLocalConversations();
  const { data, error } = await supabase.rpc('mz_chat_list_conversations');
  if (error) throw error;
  return data || [];
}

export async function loadMessages(conversationId) {
  if (useLocal()) return getLocalMessages(conversationId);
  const { data, error } = await supabase.rpc('mz_chat_list_messages', { p_conversation_id: conversationId, p_limit: 150 });
  if (error) throw error;
  return data || [];
}

export async function startDirectConversation(targetId) {
  if (useLocal()) return startLocalDirectConversation(targetId);
  const { data, error } = await supabase.rpc('mz_chat_start_direct', { p_target: targetId });
  if (error) throw error;
  return data;
}

export async function createChatGroup({ title, memberIds = [], communityId = null, roomId = null }) {
  if (useLocal()) return createLocalGroup({ title, memberIds, communityId, roomId });
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
  if (useLocal()) return sendLocalTextMessage(conversationId, body, replyTo);
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
  if (useLocal()) return sendLocalChatFile({ conversationId, file, userId });
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
  if (String(storagePath || '').startsWith('local:') || useLocal()) return openLocalAttachment(storagePath);
  const { data, error } = await supabase.storage.from('chat-files').createSignedUrl(storagePath, 120);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('No fue posible preparar la descarga.');
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  return true;
}

export async function markConversationRead(conversationId) {
  if (useLocal()) return markLocalConversationRead(conversationId);
  const { data, error } = await supabase.rpc('mz_chat_mark_read', { p_conversation_id: conversationId });
  if (error) throw error;
  return data;
}

export async function leaveConversation(conversationId) {
  if (useLocal()) return leaveLocalConversation(conversationId);
  const { data, error } = await supabase.rpc('mz_chat_leave_conversation', { p_conversation_id: conversationId });
  if (error) throw error;
  return data;
}

export async function reportChatItem({ conversationId, messageId = null, reportedUserId = null, reason, details = '', reporterId }) {
  if (useLocal()) return reportLocalChatItem({ conversationId, messageId, reportedUserId, reason, details, reporterId });
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
  if (useLocal()) {
    return subscribeLocalData(({ reason }) => {
      if (String(reason).includes('request') || String(reason).includes('block')) onRequestChange?.({ reason });
      if (String(reason).includes('message') || String(reason).includes('conversation') || String(reason).includes('group')) onMessageChange?.({ reason });
      onConversationChange?.({ reason });
    });
  }
  if (!supabase || !userId) return () => {};
  const channels = [];

  const memberChannel = supabase
    .channel(`mz-chat-members-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_conversation_members', filter: `user_id=eq.${userId}` }, payload => onConversationChange?.(payload))
    .subscribe();
  channels.push(memberChannel);

  const requestChannel = supabase
    .channel(`mz-chat-requests-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_contact_requests' }, payload => onRequestChange?.(payload))
    .subscribe();
  channels.push(requestChannel);

  if (conversationId) {
    const messageChannel = supabase
      .channel(`mz-chat-messages-${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_chat_messages', filter: `conversation_id=eq.${conversationId}` }, payload => onMessageChange?.(payload))
      .subscribe();
    channels.push(messageChannel);
  }

  return () => channels.forEach(channel => supabase.removeChannel(channel));
}
