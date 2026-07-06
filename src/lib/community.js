import { hasSupabase, supabase } from './supabase';

function requireBackend() {
  if (!hasSupabase || !supabase) throw new Error('Supabase todavía no está configurado.');
  return supabase;
}

export async function listCommunities() {
  const client = requireBackend();
  const { data, error } = await client
    .from('communities')
    .select('id,owner_id,name,slug,type,zone,description,logo_url,cover_url,status,visibility,join_mode,member_count,school_level,settings,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listMyMemberships(userId) {
  if (!userId) return [];
  const client = requireBackend();
  const { data, error } = await client
    .from('community_members')
    .select('community_id,user_id,role,status,relationship,joined_at,created_at,updated_at')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function createCommunity(values) {
  const client = requireBackend();
  const { data: communityId, error: createError } = await client.rpc('create_community_request', {
    p_name: String(values.name || '').trim(),
    p_type: values.type || 'neighborhood',
    p_zone: String(values.zone || '').trim() || null,
    p_description: String(values.description || '').trim() || null,
    p_visibility: values.visibility || 'public',
    p_join_mode: values.joinMode || 'request',
    p_school_level: values.type === 'school' ? (values.schoolLevel || null) : null,
    p_invite_code: values.joinMode === 'code' ? String(values.inviteCode || '').trim() : null
  });
  if (createError) throw createError;

  const { data, error } = await client
    .from('communities')
    .select('id,owner_id,name,slug,type,zone,description,status,visibility,join_mode,member_count,school_level,settings,created_at')
    .eq('id', communityId)
    .single();
  if (error) throw error;
  return data;
}

export async function requestCommunityJoin(communityId, code = null) {
  const client = requireBackend();
  const { data, error } = await client.rpc('request_community_join', {
    p_community_id: communityId,
    p_code: code || null
  });
  if (error) throw error;
  return data;
}

export async function leaveCommunity(communityId) {
  const client = requireBackend();
  const { data, error } = await client.rpc('leave_community', { p_community_id: communityId });
  if (error) throw error;
  return data;
}

export async function reviewMembership(communityId, userId, status, role) {
  const client = requireBackend();
  const { data, error } = await client.rpc('review_community_membership', {
    p_community_id: communityId,
    p_user_id: userId,
    p_status: status,
    p_role: role || 'member'
  });
  if (error) throw error;
  return data;
}

export async function reviewCommunity(communityId, status) {
  const client = requireBackend();
  const { data, error } = await client
    .from('communities')
    .update({ status })
    .eq('id', communityId)
    .select('id,status')
    .single();
  if (error) throw error;
  return data;
}

export async function loadCommunityBundle(communityId, includePrivate = true) {
  const client = requireBackend();
  const announcementsQuery = client.from('community_announcements')
    .select('id,community_id,author_id,title,body,audience,status,is_pinned,published_at,created_at')
    .eq('community_id', communityId)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50);
  const eventsQuery = client.from('community_events')
    .select('id,community_id,author_id,title,description,location,starts_at,ends_at,audience,status,created_at')
    .eq('community_id', communityId)
    .order('starts_at', { ascending: true })
    .limit(50);

  if (!includePrivate) {
    const [announcementsResult, eventsResult] = await Promise.all([announcementsQuery, eventsQuery]);
    if (announcementsResult.error) throw announcementsResult.error;
    if (eventsResult.error) throw eventsResult.error;
    return {
      announcements: announcementsResult.data || [],
      events: eventsResult.data || [],
      rooms: [],
      members: [],
      documents: []
    };
  }

  const [announcementsResult, eventsResult, roomsResult, membersResult, docsResult] = await Promise.all([
    announcementsQuery,
    eventsQuery,
    client.from('school_rooms')
      .select('id,community_id,name,grade,section,teacher_id,status,created_by,created_at')
      .eq('community_id', communityId)
      .eq('status', 'active')
      .order('name', { ascending: true }),
    client.from('community_members')
      .select('community_id,user_id,role,status,relationship,joined_at,created_at')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true }),
    client.from('community_documents')
      .select('id,community_id,uploader_id,title,file_name,storage_path,mime_type,size_bytes,visibility,expires_at,created_at')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(50)
  ]);

  for (const result of [announcementsResult, eventsResult, roomsResult, membersResult, docsResult]) {
    if (result.error) throw result.error;
  }

  const members = membersResult.data || [];
  const userIds = [...new Set(members.map(member => member.user_id).filter(Boolean))];
  let profiles = [];
  if (userIds.length) {
    const { data, error } = await client
      .from('profiles')
      .select('id,username,display_name,avatar_url,account_type,zone')
      .in('id', userIds);
    if (error) throw error;
    profiles = data || [];
  }

  return {
    announcements: announcementsResult.data || [],
    events: eventsResult.data || [],
    rooms: roomsResult.data || [],
    members: members.map(member => ({
      ...member,
      profile: profiles.find(profile => profile.id === member.user_id) || null
    })),
    documents: docsResult.data || []
  };
}

export async function createAnnouncement(communityId, authorId, values) {
  const client = requireBackend();
  const { data, error } = await client
    .from('community_announcements')
    .insert({
      community_id: communityId,
      author_id: authorId,
      title: String(values.title || '').trim(),
      body: String(values.body || '').trim(),
      audience: values.audience || 'members',
      is_pinned: Boolean(values.isPinned),
      status: 'published'
    })
    .select('id,community_id,author_id,title,body,audience,status,is_pinned,published_at,created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function createCommunityEvent(communityId, authorId, values) {
  const client = requireBackend();
  const { data, error } = await client
    .from('community_events')
    .insert({
      community_id: communityId,
      author_id: authorId,
      title: String(values.title || '').trim(),
      description: String(values.description || '').trim() || null,
      location: String(values.location || '').trim() || null,
      starts_at: new Date(values.startsAt).toISOString(),
      ends_at: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      audience: values.audience || 'members',
      status: 'published'
    })
    .select('id,community_id,author_id,title,description,location,starts_at,ends_at,audience,status,created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function createSchoolRoom(communityId, userId, values) {
  const client = requireBackend();
  const { data, error } = await client
    .from('school_rooms')
    .insert({
      community_id: communityId,
      created_by: userId,
      teacher_id: values.teacherId || userId,
      name: String(values.name || '').trim(),
      grade: String(values.grade || '').trim() || null,
      section: String(values.section || '').trim() || null,
      status: 'active'
    })
    .select('id,community_id,name,grade,section,teacher_id,status,created_by,created_at')
    .single();
  if (error) throw error;
  return data;
}

function safeFileName(value) {
  return String(value || 'archivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(-120);
}

export async function uploadCommunityDocument(communityId, userId, file, values = {}) {
  const client = requireBackend();
  if (!file) throw new Error('Selecciona un archivo.');
  if (file.size > 20 * 1024 * 1024) throw new Error('El archivo supera el límite de 20 MB.');

  const path = `${communityId}/${userId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await client.storage.from('community-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined
  });
  if (uploadError) throw uploadError;

  const { data, error } = await client
    .from('community_documents')
    .insert({
      community_id: communityId,
      uploader_id: userId,
      title: String(values.title || file.name).trim(),
      file_name: file.name,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      visibility: values.visibility || 'members',
      expires_at: values.expiresAt || null
    })
    .select('id,community_id,uploader_id,title,file_name,storage_path,mime_type,size_bytes,visibility,expires_at,created_at')
    .single();

  if (error) {
    await client.storage.from('community-files').remove([path]);
    throw error;
  }
  return data;
}

export async function createDocumentSignedUrl(path) {
  const client = requireBackend();
  const { data, error } = await client.storage.from('community-files').createSignedUrl(path, 120);
  if (error) throw error;
  return data?.signedUrl;
}

export function subscribeCommunity(communityId, onChange) {
  if (!supabase || !communityId) return () => {};
  const channel = supabase
    .channel(`community-${communityId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'community_announcements', filter: `community_id=eq.${communityId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'community_events', filter: `community_id=eq.${communityId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members', filter: `community_id=eq.${communityId}` }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
