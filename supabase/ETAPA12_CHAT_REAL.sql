-- MiZona Enterprise V8 · Etapa 12
-- MiZona Chat real: contactos, invitaciones, bloqueo, conversaciones,
-- grupos escolares, mensajes en tiempo real y archivos privados temporales.
-- Requiere Etapa 10 y Etapa 11 instaladas correctamente.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. TABLAS DE CONTACTOS Y SEGURIDAD
-- =========================================================
create table if not exists public.mz_user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint mz_user_blocks_not_self check (blocker_id <> blocked_id)
);

create table if not exists public.mz_contact_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  pair_min uuid generated always as (least(sender_id, receiver_id)) stored,
  pair_max uuid generated always as (greatest(sender_id, receiver_id)) stored,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (pair_min, pair_max),
  constraint mz_contact_requests_not_self check (sender_id <> receiver_id),
  constraint mz_contact_requests_status check (status in ('pending','accepted','rejected','cancelled'))
);

create table if not exists public.mz_contacts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, contact_id),
  constraint mz_contacts_not_self check (user_id <> contact_id)
);

create index if not exists mz_contact_requests_receiver_idx on public.mz_contact_requests(receiver_id, status, updated_at desc);
create index if not exists mz_contact_requests_sender_idx on public.mz_contact_requests(sender_id, status, updated_at desc);
create index if not exists mz_contacts_user_idx on public.mz_contacts(user_id, created_at desc);

-- =========================================================
-- 2. CONVERSACIONES Y MENSAJES
-- =========================================================
create table if not exists public.mz_conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  title text,
  direct_key text unique,
  community_id uuid references public.communities(id) on delete cascade,
  room_id uuid references public.school_rooms(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  retention_days integer not null default 7,
  status text not null default 'active',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mz_conversations_type check (type in ('direct','group','school','school_room')),
  constraint mz_conversations_status check (status in ('active','archived','suspended')),
  constraint mz_conversations_retention check (retention_days between 1 and 30)
);

create table if not exists public.mz_conversation_members (
  conversation_id uuid not null references public.mz_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  muted boolean not null default false,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id),
  constraint mz_conversation_members_role check (role in ('owner','admin','member')),
  constraint mz_conversation_members_status check (status in ('active','left','removed','blocked'))
);

create table if not exists public.mz_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.mz_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text,
  message_type text not null default 'text',
  reply_to uuid references public.mz_chat_messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mz_chat_messages_type check (message_type in ('text','image','file','system')),
  constraint mz_chat_messages_body_length check (body is null or char_length(body) <= 5000)
);

create table if not exists public.mz_chat_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.mz_chat_messages(id) on delete cascade,
  conversation_id uuid not null references public.mz_conversations(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mz_chat_attachments_size check (size_bytes >= 0 and size_bytes <= 26214400)
);

create table if not exists public.mz_chat_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.mz_conversations(id) on delete cascade,
  message_id uuid references public.mz_chat_messages(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mz_chat_reports_status check (status in ('pending','reviewing','resolved','dismissed'))
);

create index if not exists mz_conversation_members_user_idx on public.mz_conversation_members(user_id, status, updated_at desc);
create index if not exists mz_messages_conversation_idx on public.mz_chat_messages(conversation_id, created_at desc);
create index if not exists mz_messages_expiry_idx on public.mz_chat_messages(expires_at) where deleted_at is null;
create index if not exists mz_attachments_message_idx on public.mz_chat_attachments(message_id);
create index if not exists mz_reports_status_idx on public.mz_chat_reports(status, created_at desc);

-- =========================================================
-- 3. FUNCIONES INTERNAS DE SEGURIDAD
-- =========================================================
create or replace function public.mz_chat_is_member(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null and exists (
    select 1
    from public.mz_conversation_members cm
    join public.mz_conversations c on c.id = cm.conversation_id
    where cm.conversation_id = p_conversation_id
      and cm.user_id = p_user_id
      and cm.status = 'active'
      and c.status = 'active'
  );
$$;

create or replace function public.mz_chat_is_manager(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(p_user_id) or exists (
    select 1 from public.mz_conversation_members
    where conversation_id = p_conversation_id
      and user_id = p_user_id
      and status = 'active'
      and role in ('owner','admin')
  );
$$;

create or replace function public.mz_chat_are_contacts(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_a is not null and p_b is not null and exists (
    select 1 from public.mz_contacts
    where user_id = p_a and contact_id = p_b
  );
$$;

create or replace function public.mz_chat_is_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mz_user_blocks
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

create or replace function public.mz_chat_shares_school(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members a
    join public.community_members b on b.community_id = a.community_id
    join public.communities c on c.id = a.community_id
    where a.user_id = p_a and a.status = 'active'
      and b.user_id = p_b and b.status = 'active'
      and c.type = 'school' and c.status = 'active'
  );
$$;

create or replace function public.mz_chat_school_relation_allowed(p_a uuid, p_b uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  a_type text;
  b_type text;
begin
  select account_type into a_type from public.profiles where id = p_a and status = 'active';
  select account_type into b_type from public.profiles where id = p_b and status = 'active';
  if a_type is null or b_type is null then return false; end if;
  if a_type <> 'student' and b_type <> 'student' then return true; end if;
  if not public.mz_chat_shares_school(p_a, p_b) then return false; end if;
  if a_type = 'student' and b_type = 'student' then return true; end if;

  return exists (
    select 1
    from public.community_members adult_member
    join public.community_members student_member on student_member.community_id = adult_member.community_id
    join public.communities c on c.id = adult_member.community_id
    where c.type = 'school' and c.status = 'active'
      and adult_member.status = 'active'
      and student_member.status = 'active'
      and adult_member.role in ('owner','admin','moderator','teacher','parent')
      and (
        (a_type = 'student' and student_member.user_id = p_a and adult_member.user_id = p_b)
        or
        (b_type = 'student' and student_member.user_id = p_b and adult_member.user_id = p_a)
      )
  );
end;
$$;

create or replace function public.mz_chat_can_discover(p_target uuid, p_viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_viewer is not null
    and p_target is not null
    and p_target <> p_viewer
    and exists(select 1 from public.profiles p where p.id = p_target and p.status = 'active')
    and not public.mz_chat_is_blocked(p_viewer, p_target)
    and public.mz_chat_school_relation_allowed(p_viewer, p_target);
$$;

grant execute on function public.mz_chat_is_member(uuid,uuid) to authenticated;
grant execute on function public.mz_chat_is_manager(uuid,uuid) to authenticated;
grant execute on function public.mz_chat_are_contacts(uuid,uuid) to authenticated;
grant execute on function public.mz_chat_is_blocked(uuid,uuid) to authenticated;
grant execute on function public.mz_chat_can_discover(uuid,uuid) to authenticated;

-- =========================================================
-- 4. TRIGGERS
-- =========================================================
create or replace function public.mz_chat_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mz_contact_requests_touch on public.mz_contact_requests;
create trigger trg_mz_contact_requests_touch before update on public.mz_contact_requests
for each row execute function public.mz_chat_touch_updated_at();

drop trigger if exists trg_mz_conversations_touch on public.mz_conversations;
create trigger trg_mz_conversations_touch before update on public.mz_conversations
for each row execute function public.mz_chat_touch_updated_at();

drop trigger if exists trg_mz_conversation_members_touch on public.mz_conversation_members;
create trigger trg_mz_conversation_members_touch before update on public.mz_conversation_members
for each row execute function public.mz_chat_touch_updated_at();

create or replace function public.mz_chat_prepare_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  days_to_keep integer;
begin
  if not public.mz_chat_is_member(new.conversation_id, new.sender_id) then
    raise exception 'No perteneces a esta conversación';
  end if;
  select retention_days into days_to_keep from public.mz_conversations where id = new.conversation_id;
  new.body := nullif(trim(coalesce(new.body,'')), '');
  if new.message_type = 'text' and new.body is null then
    raise exception 'El mensaje está vacío';
  end if;
  new.expires_at := coalesce(new.expires_at, now() + make_interval(days => coalesce(days_to_keep,7)));
  return new;
end;
$$;

drop trigger if exists trg_mz_chat_prepare_message on public.mz_chat_messages;
create trigger trg_mz_chat_prepare_message before insert on public.mz_chat_messages
for each row execute function public.mz_chat_prepare_message();

create or replace function public.mz_chat_after_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mz_conversations
  set last_message_at = new.created_at, updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_mz_chat_after_message on public.mz_chat_messages;
create trigger trg_mz_chat_after_message after insert on public.mz_chat_messages
for each row execute function public.mz_chat_after_message();

create or replace function public.mz_chat_prepare_attachment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation uuid;
  v_expires timestamptz;
begin
  select conversation_id, expires_at into v_conversation, v_expires
  from public.mz_chat_messages where id = new.message_id;
  if v_conversation is null or v_conversation <> new.conversation_id then
    raise exception 'El archivo no corresponde al mensaje';
  end if;
  if not public.mz_chat_is_member(new.conversation_id, new.uploader_id) then
    raise exception 'Sin permiso para adjuntar archivos';
  end if;
  new.expires_at := coalesce(new.expires_at, v_expires);
  return new;
end;
$$;

drop trigger if exists trg_mz_chat_prepare_attachment on public.mz_chat_attachments;
create trigger trg_mz_chat_prepare_attachment before insert on public.mz_chat_attachments
for each row execute function public.mz_chat_prepare_attachment();

-- =========================================================
-- 5. RPC: BÚSQUEDA, CONTACTOS Y BLOQUEOS
-- =========================================================
create or replace function public.mz_chat_find_profile_exact(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  account_type text,
  zone text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username::text, p.display_name, p.avatar_url, p.account_type, p.zone
  from public.profiles p
  where p.username = public.normalize_username(p_username)::citext
    and public.mz_chat_can_discover(p.id, auth.uid())
  limit 1;
$$;

grant execute on function public.mz_chat_find_profile_exact(text) to authenticated;

create or replace function public.mz_chat_send_contact_request(p_username text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_receiver uuid;
  v_existing public.mz_contact_requests%rowtype;
  v_id uuid;
begin
  if v_sender is null then raise exception 'Debes iniciar sesión'; end if;
  select p.id into v_receiver from public.profiles p
  where p.username = public.normalize_username(p_username)::citext
    and public.mz_chat_can_discover(p.id, v_sender)
  limit 1;
  if v_receiver is null then raise exception 'Usuario no encontrado o no disponible para contacto'; end if;

  select * into v_existing from public.mz_contact_requests
  where pair_min = least(v_sender,v_receiver) and pair_max = greatest(v_sender,v_receiver);

  if found then
    if v_existing.status = 'accepted' then return v_existing.id; end if;
    if v_existing.status = 'pending' then return v_existing.id; end if;
    update public.mz_contact_requests
      set sender_id=v_sender, receiver_id=v_receiver, status='pending', responded_at=null, updated_at=now()
      where id=v_existing.id returning id into v_id;
    return v_id;
  end if;

  insert into public.mz_contact_requests(sender_id,receiver_id,status)
  values(v_sender,v_receiver,'pending') returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.mz_chat_send_contact_request(text) to authenticated;

create or replace function public.mz_chat_review_contact_request(p_request_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.mz_contact_requests%rowtype;
begin
  select * into v_request from public.mz_contact_requests where id=p_request_id for update;
  if not found then raise exception 'Solicitud no encontrada'; end if;
  if v_request.receiver_id <> auth.uid() then raise exception 'Solo el destinatario puede responder'; end if;
  if p_action not in ('accepted','rejected') then raise exception 'Acción inválida'; end if;

  update public.mz_contact_requests
  set status=p_action, responded_at=now(), updated_at=now()
  where id=p_request_id;

  if p_action='accepted' then
    if public.mz_chat_is_blocked(v_request.sender_id,v_request.receiver_id) then
      raise exception 'No se puede aceptar porque existe un bloqueo';
    end if;
    insert into public.mz_contacts(user_id,contact_id) values
      (v_request.sender_id,v_request.receiver_id),
      (v_request.receiver_id,v_request.sender_id)
    on conflict do nothing;
  end if;
  return p_action;
end;
$$;

grant execute on function public.mz_chat_review_contact_request(uuid,text) to authenticated;

create or replace function public.mz_chat_block_user(p_target uuid, p_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_target is null or p_target=auth.uid() then raise exception 'Usuario inválido'; end if;
  insert into public.mz_user_blocks(blocker_id,blocked_id,reason)
  values(auth.uid(),p_target,nullif(trim(coalesce(p_reason,'')),''))
  on conflict (blocker_id,blocked_id) do update set reason=excluded.reason,created_at=now();
  delete from public.mz_contacts
  where (user_id=auth.uid() and contact_id=p_target) or (user_id=p_target and contact_id=auth.uid());
  update public.mz_contact_requests set status='cancelled',responded_at=now(),updated_at=now()
  where pair_min=least(auth.uid(),p_target) and pair_max=greatest(auth.uid(),p_target);
  update public.mz_conversation_members cm
  set status='blocked',updated_at=now()
  from public.mz_conversations c
  where c.id=cm.conversation_id
    and c.type='direct'
    and c.direct_key=least(auth.uid(),p_target)::text || ':' || greatest(auth.uid(),p_target)::text
    and cm.user_id in (auth.uid(),p_target);
  return true;
end;
$$;

grant execute on function public.mz_chat_block_user(uuid,text) to authenticated;

create or replace function public.mz_chat_unblock_user(p_target uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.mz_user_blocks where blocker_id=auth.uid() and blocked_id=p_target;
  return found;
end;
$$;

grant execute on function public.mz_chat_unblock_user(uuid) to authenticated;

-- =========================================================
-- 6. RPC: CONVERSACIONES Y MENSAJES
-- =========================================================
create or replace function public.mz_chat_start_direct(p_target uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_key text;
  v_id uuid;
begin
  if v_user is null or p_target is null or p_target=v_user then raise exception 'Usuario inválido'; end if;
  if not public.mz_chat_are_contacts(v_user,p_target) then raise exception 'Primero deben aceptar la solicitud de contacto'; end if;
  if public.mz_chat_is_blocked(v_user,p_target) then raise exception 'La conversación no está disponible'; end if;
  v_key := least(v_user,p_target)::text || ':' || greatest(v_user,p_target)::text;

  select id into v_id from public.mz_conversations where direct_key=v_key;
  if v_id is null then
    insert into public.mz_conversations(type,direct_key,created_by,retention_days)
    values('direct',v_key,v_user,7) returning id into v_id;
  else
    update public.mz_conversations set status='active',updated_at=now() where id=v_id;
  end if;

  insert into public.mz_conversation_members(conversation_id,user_id,role,status) values
    (v_id,v_user,'owner','active'),
    (v_id,p_target,'member','active')
  on conflict (conversation_id,user_id) do update set status='active',updated_at=now();
  return v_id;
end;
$$;

grant execute on function public.mz_chat_start_direct(uuid) to authenticated;

create or replace function public.mz_chat_create_group(
  p_title text,
  p_member_ids uuid[] default array[]::uuid[],
  p_community_id uuid default null,
  p_room_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_member uuid;
  v_type text := 'group';
begin
  if v_user is null then raise exception 'Debes iniciar sesión'; end if;
  if char_length(trim(coalesce(p_title,''))) < 3 then raise exception 'El grupo necesita un nombre'; end if;

  if p_room_id is not null then
    select community_id into p_community_id from public.school_rooms where id=p_room_id;
    if p_community_id is null then raise exception 'Aula no encontrada'; end if;
    v_type := 'school_room';
  elsif p_community_id is not null then
    v_type := 'school';
  end if;

  if p_community_id is not null and not public.is_community_member(p_community_id,v_user) then
    raise exception 'No perteneces a esa comunidad';
  end if;

  insert into public.mz_conversations(type,title,community_id,room_id,created_by,retention_days)
  values(v_type,trim(p_title),p_community_id,p_room_id,v_user,7)
  returning id into v_id;

  insert into public.mz_conversation_members(conversation_id,user_id,role,status)
  values(v_id,v_user,'owner','active');

  foreach v_member in array coalesce(p_member_ids,array[]::uuid[]) loop
    if v_member is null or v_member=v_user then continue; end if;
    if public.mz_chat_is_blocked(v_user,v_member) then raise exception 'Uno de los usuarios está bloqueado'; end if;
    if p_community_id is not null then
      if not public.is_community_member(p_community_id,v_member) then raise exception 'Todos deben pertenecer a la comunidad'; end if;
    elsif not public.mz_chat_are_contacts(v_user,v_member) then
      raise exception 'Solo puedes agregar contactos aceptados';
    end if;
    insert into public.mz_conversation_members(conversation_id,user_id,role,status)
    values(v_id,v_member,'member','active') on conflict do nothing;
  end loop;
  return v_id;
end;
$$;

grant execute on function public.mz_chat_create_group(text,uuid[],uuid,uuid) to authenticated;

create or replace function public.mz_chat_send_message(
  p_conversation_id uuid,
  p_body text,
  p_message_type text default 'text',
  p_reply_to uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if not public.mz_chat_is_member(p_conversation_id,auth.uid()) then raise exception 'No perteneces a esta conversación'; end if;
  if p_message_type not in ('text','image','file','system') then raise exception 'Tipo de mensaje inválido'; end if;
  insert into public.mz_chat_messages(conversation_id,sender_id,body,message_type,reply_to)
  values(p_conversation_id,auth.uid(),p_body,p_message_type,p_reply_to)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.mz_chat_send_message(uuid,text,text,uuid) to authenticated;

create or replace function public.mz_chat_mark_read(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mz_conversation_members set last_read_at=now(),updated_at=now()
  where conversation_id=p_conversation_id and user_id=auth.uid() and status='active';
  return found;
end;
$$;

grant execute on function public.mz_chat_mark_read(uuid) to authenticated;

create or replace function public.mz_chat_leave_conversation(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mz_conversation_members set status='left',updated_at=now()
  where conversation_id=p_conversation_id and user_id=auth.uid();
  return found;
end;
$$;

grant execute on function public.mz_chat_leave_conversation(uuid) to authenticated;

-- =========================================================
-- 7. RPC: LISTADOS SEGUROS PARA LA APP
-- =========================================================
create or replace function public.mz_chat_list_contacts()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  account_type text,
  zone text,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,p.username::text,p.display_name,p.avatar_url,p.account_type,p.zone,c.created_at
  from public.mz_contacts c
  join public.profiles p on p.id=c.contact_id
  where c.user_id=auth.uid() and p.status='active'
    and not public.mz_chat_is_blocked(auth.uid(),p.id)
  order by lower(p.display_name),lower(p.username::text);
$$;

grant execute on function public.mz_chat_list_contacts() to authenticated;

create or replace function public.mz_chat_list_requests()
returns table (
  id uuid,
  direction text,
  status text,
  other_user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  account_type text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id,
    case when r.receiver_id=auth.uid() then 'received' else 'sent' end,
    r.status,
    p.id,p.username::text,p.display_name,p.avatar_url,p.account_type,r.updated_at
  from public.mz_contact_requests r
  join public.profiles p on p.id=case when r.receiver_id=auth.uid() then r.sender_id else r.receiver_id end
  where (r.sender_id=auth.uid() or r.receiver_id=auth.uid())
    and r.status in ('pending','accepted','rejected')
  order by r.updated_at desc;
$$;

grant execute on function public.mz_chat_list_requests() to authenticated;

create or replace function public.mz_chat_list_conversations()
returns table (
  id uuid,
  type text,
  title text,
  community_id uuid,
  room_id uuid,
  retention_days integer,
  last_message_at timestamptz,
  updated_at timestamptz,
  unread_count bigint,
  peer_id uuid,
  peer_username text,
  peer_display_name text,
  peer_avatar_url text,
  last_message text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id,c.type,c.title,c.community_id,c.room_id,c.retention_days,c.last_message_at,c.updated_at,
    (select count(*) from public.mz_chat_messages m
      where m.conversation_id=c.id and m.sender_id<>auth.uid()
        and m.deleted_at is null and (m.expires_at is null or m.expires_at>now())
        and m.created_at>coalesce(me.last_read_at,'1970-01-01'::timestamptz)) as unread_count,
    peer.id,peer.username::text,peer.display_name,peer.avatar_url,
    (select case when m.message_type in ('file','image') then coalesce(m.body,'Archivo') else m.body end
      from public.mz_chat_messages m where m.conversation_id=c.id and m.deleted_at is null
        and (m.expires_at is null or m.expires_at>now()) order by m.created_at desc limit 1) as last_message
  from public.mz_conversation_members me
  join public.mz_conversations c on c.id=me.conversation_id
  left join lateral (
    select p.* from public.mz_conversation_members other
    join public.profiles p on p.id=other.user_id
    where other.conversation_id=c.id and other.user_id<>auth.uid() and other.status='active'
    order by other.joined_at limit 1
  ) peer on c.type='direct'
  where me.user_id=auth.uid() and me.status='active' and c.status='active'
  order by coalesce(c.last_message_at,c.created_at) desc;
$$;

grant execute on function public.mz_chat_list_conversations() to authenticated;

create or replace function public.mz_chat_list_messages(p_conversation_id uuid, p_limit integer default 100)
returns table (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  sender_username text,
  sender_display_name text,
  sender_avatar_url text,
  body text,
  message_type text,
  reply_to uuid,
  edited_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  attachments jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.mz_chat_is_member(p_conversation_id,auth.uid()) then raise exception 'Sin acceso a esta conversación'; end if;
  return query
  select x.id,x.conversation_id,x.sender_id,p.username::text,p.display_name,p.avatar_url,
    x.body,x.message_type,x.reply_to,x.edited_at,x.expires_at,x.created_at,
    coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'file_name',a.file_name,'storage_path',a.storage_path,
      'mime_type',a.mime_type,'size_bytes',a.size_bytes,'expires_at',a.expires_at
    ) order by a.created_at) from public.mz_chat_attachments a where a.message_id=x.id),'[]'::jsonb)
  from (
    select m.* from public.mz_chat_messages m
    where m.conversation_id=p_conversation_id
      and m.deleted_at is null
      and (m.expires_at is null or m.expires_at>now())
    order by m.created_at desc
    limit greatest(1,least(coalesce(p_limit,100),200))
  ) x
  join public.profiles p on p.id=x.sender_id
  order by x.created_at asc;
end;
$$;

grant execute on function public.mz_chat_list_messages(uuid,integer) to authenticated;

-- =========================================================
-- 8. LIMPIEZA DE MENSAJES EXPIRADOS
-- =========================================================
create or replace function public.mz_chat_cleanup_expired()
returns integer
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deleted_count integer;
begin
  delete from storage.objects o
  using public.mz_chat_attachments a
  where o.bucket_id='chat-files'
    and o.name=a.storage_path
    and a.expires_at is not null and a.expires_at<now();

  delete from public.mz_chat_messages
  where expires_at is not null and expires_at<now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.mz_chat_cleanup_expired() from public, anon, authenticated;

-- =========================================================
-- 9. RLS
-- =========================================================
alter table public.mz_user_blocks enable row level security;
alter table public.mz_contact_requests enable row level security;
alter table public.mz_contacts enable row level security;
alter table public.mz_conversations enable row level security;
alter table public.mz_conversation_members enable row level security;
alter table public.mz_chat_messages enable row level security;
alter table public.mz_chat_attachments enable row level security;
alter table public.mz_chat_reports enable row level security;

-- Bloqueos.
drop policy if exists "MZ blocks own read" on public.mz_user_blocks;
create policy "MZ blocks own read" on public.mz_user_blocks for select to authenticated
using (blocker_id=auth.uid());
drop policy if exists "MZ blocks own insert" on public.mz_user_blocks;
create policy "MZ blocks own insert" on public.mz_user_blocks for insert to authenticated
with check (blocker_id=auth.uid());
drop policy if exists "MZ blocks own delete" on public.mz_user_blocks;
create policy "MZ blocks own delete" on public.mz_user_blocks for delete to authenticated
using (blocker_id=auth.uid());

-- Solicitudes.
drop policy if exists "MZ requests participants read" on public.mz_contact_requests;
create policy "MZ requests participants read" on public.mz_contact_requests for select to authenticated
using (sender_id=auth.uid() or receiver_id=auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "MZ requests sender insert" on public.mz_contact_requests;
create policy "MZ requests sender insert" on public.mz_contact_requests for insert to authenticated
with check (sender_id=auth.uid());
drop policy if exists "MZ requests participants update" on public.mz_contact_requests;
create policy "MZ requests participants update" on public.mz_contact_requests for update to authenticated
using (sender_id=auth.uid() or receiver_id=auth.uid() or public.is_admin(auth.uid()))
with check (sender_id=auth.uid() or receiver_id=auth.uid() or public.is_admin(auth.uid()));

-- Contactos.
drop policy if exists "MZ contacts own read" on public.mz_contacts;
create policy "MZ contacts own read" on public.mz_contacts for select to authenticated
using (user_id=auth.uid() or public.is_admin(auth.uid()));

-- Conversaciones y miembros.
drop policy if exists "MZ conversations member read" on public.mz_conversations;
create policy "MZ conversations member read" on public.mz_conversations for select to authenticated
using (public.mz_chat_is_member(id,auth.uid()) or public.is_admin(auth.uid()));
drop policy if exists "MZ conversations creator insert" on public.mz_conversations;
create policy "MZ conversations creator insert" on public.mz_conversations for insert to authenticated
with check (created_by=auth.uid());
drop policy if exists "MZ conversations manager update" on public.mz_conversations;
create policy "MZ conversations manager update" on public.mz_conversations for update to authenticated
using (public.mz_chat_is_manager(id,auth.uid())) with check (public.mz_chat_is_manager(id,auth.uid()));

drop policy if exists "MZ conversation members member read" on public.mz_conversation_members;
create policy "MZ conversation members member read" on public.mz_conversation_members for select to authenticated
using (user_id=auth.uid() or public.mz_chat_is_member(conversation_id,auth.uid()) or public.is_admin(auth.uid()));
drop policy if exists "MZ conversation members manager insert" on public.mz_conversation_members;
create policy "MZ conversation members manager insert" on public.mz_conversation_members for insert to authenticated
with check (user_id=auth.uid() or public.mz_chat_is_manager(conversation_id,auth.uid()));
drop policy if exists "MZ conversation members self or manager update" on public.mz_conversation_members;
create policy "MZ conversation members self or manager update" on public.mz_conversation_members for update to authenticated
using (user_id=auth.uid() or public.mz_chat_is_manager(conversation_id,auth.uid()))
with check (user_id=auth.uid() or public.mz_chat_is_manager(conversation_id,auth.uid()));

-- Mensajes.
drop policy if exists "MZ messages member read" on public.mz_chat_messages;
create policy "MZ messages member read" on public.mz_chat_messages for select to authenticated
using (public.mz_chat_is_member(conversation_id,auth.uid()) and deleted_at is null and (expires_at is null or expires_at>now()));
drop policy if exists "MZ messages member insert" on public.mz_chat_messages;
create policy "MZ messages member insert" on public.mz_chat_messages for insert to authenticated
with check (sender_id=auth.uid() and public.mz_chat_is_member(conversation_id,auth.uid()));
drop policy if exists "MZ messages sender update" on public.mz_chat_messages;
create policy "MZ messages sender update" on public.mz_chat_messages for update to authenticated
using (sender_id=auth.uid() or public.mz_chat_is_manager(conversation_id,auth.uid()))
with check (sender_id=auth.uid() or public.mz_chat_is_manager(conversation_id,auth.uid()));
drop policy if exists "MZ messages sender delete" on public.mz_chat_messages;
create policy "MZ messages sender delete" on public.mz_chat_messages for delete to authenticated
using (sender_id=auth.uid() or public.mz_chat_is_manager(conversation_id,auth.uid()));

-- Adjuntos.
drop policy if exists "MZ attachments member read" on public.mz_chat_attachments;
create policy "MZ attachments member read" on public.mz_chat_attachments for select to authenticated
using (public.mz_chat_is_member(conversation_id,auth.uid()) and (expires_at is null or expires_at>now()));
drop policy if exists "MZ attachments uploader insert" on public.mz_chat_attachments;
create policy "MZ attachments uploader insert" on public.mz_chat_attachments for insert to authenticated
with check (uploader_id=auth.uid() and public.mz_chat_is_member(conversation_id,auth.uid()));
drop policy if exists "MZ attachments uploader delete" on public.mz_chat_attachments;
create policy "MZ attachments uploader delete" on public.mz_chat_attachments for delete to authenticated
using (uploader_id=auth.uid() or public.mz_chat_is_manager(conversation_id,auth.uid()));

-- Reportes.
drop policy if exists "MZ reports own or admin read" on public.mz_chat_reports;
create policy "MZ reports own or admin read" on public.mz_chat_reports for select to authenticated
using (reporter_id=auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "MZ reports own insert" on public.mz_chat_reports;
create policy "MZ reports own insert" on public.mz_chat_reports for insert to authenticated
with check (reporter_id=auth.uid());
drop policy if exists "MZ reports admin update" on public.mz_chat_reports;
create policy "MZ reports admin update" on public.mz_chat_reports for update to authenticated
using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- =========================================================
-- 10. STORAGE PRIVADO DEL CHAT
-- =========================================================
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'chat-files','chat-files',false,26214400,
  array[
    'image/jpeg','image/png','image/webp','image/gif','application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','text/csv','application/zip'
  ]
)
on conflict (id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.mz_chat_storage_conversation_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
declare raw_id text;
begin
  raw_id := (storage.foldername(p_name))[1];
  if raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return raw_id::uuid;
  end if;
  return null;
exception when others then return null;
end;
$$;

drop policy if exists "MZ chat files member read" on storage.objects;
create policy "MZ chat files member read" on storage.objects for select to authenticated
using (bucket_id='chat-files' and public.mz_chat_is_member(public.mz_chat_storage_conversation_id(name),auth.uid()));

drop policy if exists "MZ chat files member upload" on storage.objects;
create policy "MZ chat files member upload" on storage.objects for insert to authenticated
with check (
  bucket_id='chat-files'
  and public.mz_chat_is_member(public.mz_chat_storage_conversation_id(name),auth.uid())
  and (storage.foldername(name))[2]=auth.uid()::text
);

drop policy if exists "MZ chat files owner delete" on storage.objects;
create policy "MZ chat files owner delete" on storage.objects for delete to authenticated
using (
  bucket_id='chat-files' and (
    (storage.foldername(name))[2]=auth.uid()::text
    or public.mz_chat_is_manager(public.mz_chat_storage_conversation_id(name),auth.uid())
  )
);

-- =========================================================
-- 11. PERMISOS Y REALTIME
-- =========================================================
grant select,insert,update,delete on public.mz_user_blocks to authenticated;
grant select,insert,update,delete on public.mz_contact_requests to authenticated;
grant select,insert,update,delete on public.mz_contacts to authenticated;
grant select,insert,update,delete on public.mz_conversations to authenticated;
grant select,insert,update,delete on public.mz_conversation_members to authenticated;
grant select,insert,update,delete on public.mz_chat_messages to authenticated;
grant select,insert,update,delete on public.mz_chat_attachments to authenticated;
grant select,insert,update,delete on public.mz_chat_reports to authenticated;

do $$
begin
  begin alter publication supabase_realtime add table public.mz_contact_requests; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.mz_conversations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.mz_conversation_members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.mz_chat_messages; exception when duplicate_object then null; end;
end $$;

-- =========================================================
-- 12. VERIFICACIÓN FINAL
-- =========================================================
select
  to_regclass('public.mz_contact_requests') is not null as contact_requests_ok,
  to_regclass('public.mz_conversations') is not null as conversations_ok,
  to_regclass('public.mz_chat_messages') is not null as messages_ok,
  to_regclass('public.mz_chat_attachments') is not null as attachments_ok,
  to_regprocedure('public.mz_chat_send_message(uuid,text,text,uuid)') is not null as send_message_ok,
  exists(select 1 from storage.buckets where id='chat-files') as bucket_ok;
