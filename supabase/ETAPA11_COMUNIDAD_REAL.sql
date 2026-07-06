-- MiZona Enterprise V8 · Etapa 11
-- Mi Comunidad real: comunidades, membresías, colegios, comunicados,
-- eventos, aulas, documentos, almacenamiento y moderación.
-- Requiere haber ejecutado primero ETAPA10_EJECUTAR.sql.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. COMUNIDADES
-- =========================================================
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  type text not null default 'neighborhood',
  zone text,
  description text,
  logo_url text,
  cover_url text,
  status text not null default 'pending',
  visibility text not null default 'public',
  join_mode text not null default 'request',
  member_count integer not null default 0,
  school_level text,
  school_code text,
  settings jsonb not null default '{"announcements":true,"events":true,"documents":true,"chat":true,"transfer_days":7,"video_calls":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communities_name_length check (char_length(trim(name)) between 3 and 100),
  constraint communities_type_check check (type in ('school','committee','club','urbanization','company','church','association','neighborhood','other')),
  constraint communities_status_check check (status in ('pending','active','rejected','suspended','archived')),
  constraint communities_visibility_check check (visibility in ('public','private','school')),
  constraint communities_join_mode_check check (join_mode in ('open','request','code','invite'))
);

create index if not exists communities_status_type_idx on public.communities(status, type);
create index if not exists communities_zone_idx on public.communities(lower(coalesce(zone,'')));
create index if not exists communities_owner_idx on public.communities(owner_id);

create table if not exists public.community_invite_codes (
  community_id uuid primary key references public.communities(id) on delete cascade,
  code_hash text not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 2. MEMBRESÍAS
-- =========================================================
create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'pending',
  relationship text,
  invited_by uuid references public.profiles(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (community_id, user_id),
  constraint community_members_role_check check (role in ('owner','admin','moderator','teacher','parent','student','member')),
  constraint community_members_status_check check (status in ('pending','active','rejected','blocked','left'))
);

create index if not exists community_members_user_idx on public.community_members(user_id, status);
create index if not exists community_members_community_idx on public.community_members(community_id, status, role);

-- =========================================================
-- 3. CONTENIDO DE COMUNIDAD
-- =========================================================
create table if not exists public.community_announcements (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  audience text not null default 'members',
  status text not null default 'published',
  is_pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_announcements_title_check check (char_length(trim(title)) between 3 and 140),
  constraint community_announcements_body_check check (char_length(trim(body)) between 3 and 5000),
  constraint community_announcements_audience_check check (audience in ('public','members','staff','parents','students')),
  constraint community_announcements_status_check check (status in ('draft','published','archived'))
);

create index if not exists announcements_community_date_idx on public.community_announcements(community_id, published_at desc);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  audience text not null default 'members',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_events_title_check check (char_length(trim(title)) between 3 and 140),
  constraint community_events_audience_check check (audience in ('public','members','staff','parents','students')),
  constraint community_events_status_check check (status in ('draft','published','cancelled','archived')),
  constraint community_events_dates_check check (ends_at is null or ends_at >= starts_at)
);

create index if not exists events_community_date_idx on public.community_events(community_id, starts_at);

create table if not exists public.school_rooms (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null,
  grade text,
  section text,
  teacher_id uuid references public.profiles(id),
  status text not null default 'active',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, name),
  constraint school_rooms_status_check check (status in ('active','archived'))
);

create table if not exists public.school_room_members (
  room_id uuid not null references public.school_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'student',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  constraint school_room_members_role_check check (role in ('teacher','assistant','student','parent')),
  constraint school_room_members_status_check check (status in ('active','blocked','left'))
);

create table if not exists public.community_documents (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  visibility text not null default 'members',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint community_documents_visibility_check check (visibility in ('members','staff','parents','students')),
  constraint community_documents_size_check check (size_bytes >= 0 and size_bytes <= 20971520)
);

create index if not exists community_documents_community_idx on public.community_documents(community_id, created_at desc);

-- =========================================================
-- 4. FUNCIONES DE SEGURIDAD
-- =========================================================
create or replace function public.make_community_slug(p_name text)
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  base_slug := lower(regexp_replace(trim(coalesce(p_name, 'comunidad')), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'comunidad'; end if;
  candidate := base_slug;
  while exists(select 1 from public.communities where slug = candidate) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  end loop;
  return candidate;
end;
$$;

create or replace function public.is_community_member(
  p_community_id uuid,
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
    from public.community_members cm
    where cm.community_id = p_community_id
      and cm.user_id = p_user_id
      and cm.status = 'active'
  );
$$;

create or replace function public.is_community_admin(
  p_community_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(p_user_id) or exists (
    select 1
    from public.community_members cm
    where cm.community_id = p_community_id
      and cm.user_id = p_user_id
      and cm.status = 'active'
      and cm.role in ('owner','admin','moderator')
  );
$$;

create or replace function public.is_community_staff(
  p_community_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_community_admin(p_community_id, p_user_id) or exists (
    select 1
    from public.community_members cm
    where cm.community_id = p_community_id
      and cm.user_id = p_user_id
      and cm.status = 'active'
      and cm.role = 'teacher'
  );
$$;

grant execute on function public.is_community_member(uuid,uuid) to anon, authenticated;
grant execute on function public.is_community_admin(uuid,uuid) to anon, authenticated;
grant execute on function public.is_community_staff(uuid,uuid) to anon, authenticated;

-- Prepara toda solicitud. Un usuario normal siempre inicia pendiente.
create or replace function public.prepare_community_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para crear una comunidad';
  end if;

  new.owner_id := auth.uid();
  new.name := trim(new.name);
  new.slug := public.make_community_slug(new.name);
  new.zone := nullif(trim(coalesce(new.zone,'')), '');
  new.description := nullif(trim(coalesce(new.description,'')), '');
  new.status := case when public.is_admin(auth.uid()) then 'active' else 'pending' end;
  new.member_count := 0;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prepare_community_insert on public.communities;
create trigger trg_prepare_community_insert
before insert on public.communities
for each row execute function public.prepare_community_insert();

-- Evita que el administrador de una comunidad se autoapruebe como plataforma.
create or replace function public.protect_community_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.owner_id := old.owner_id;
  new.slug := old.slug;
  if old.status is distinct from new.status and not public.is_admin(auth.uid()) then
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_protect_community_status on public.communities;
create trigger trg_protect_community_status
before update on public.communities
for each row execute function public.protect_community_status();

-- El creador queda como propietario activo, aunque la comunidad esté pendiente.
create or replace function public.add_community_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_members(community_id,user_id,role,status,joined_at)
  values(new.id,new.owner_id,'owner','active',now())
  on conflict (community_id,user_id) do update set role='owner',status='active',joined_at=coalesce(public.community_members.joined_at,now());
  return new;
end;
$$;

drop trigger if exists trg_add_community_owner on public.communities;
create trigger trg_add_community_owner
after insert on public.communities
for each row execute function public.add_community_owner();

create or replace function public.refresh_community_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community uuid;
begin
  if TG_OP = 'DELETE' then
    v_community := old.community_id;
  else
    v_community := new.community_id;
  end if;
  update public.communities c
  set member_count = (
    select count(*)::integer from public.community_members cm
    where cm.community_id = v_community and cm.status = 'active'
  ), updated_at = now()
  where c.id = v_community;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_community_member_count on public.community_members;
create trigger trg_refresh_community_member_count
after insert or update or delete on public.community_members
for each row execute function public.refresh_community_member_count();

-- Solicitar ingreso, ingresar a comunidad abierta o validar código.
create or replace function public.request_community_join(p_community_id uuid, p_code text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_community public.communities%rowtype;
  v_hash text;
  v_status text;
  v_existing text;
begin
  if v_user is null then raise exception 'Debes iniciar sesión'; end if;

  select * into v_community from public.communities
  where id = p_community_id and status = 'active';
  if not found then raise exception 'La comunidad no está disponible'; end if;

  select status into v_existing from public.community_members
  where community_id = p_community_id and user_id = v_user;
  if v_existing = 'blocked' then raise exception 'Tu acceso a esta comunidad está bloqueado'; end if;

  if v_community.join_mode = 'invite' then
    raise exception 'Esta comunidad admite solo invitaciones';
  elsif v_community.join_mode = 'code' then
    select code_hash into v_hash from public.community_invite_codes where community_id = p_community_id;
    if v_hash is null or p_code is null or crypt(trim(p_code), v_hash) <> v_hash then
      raise exception 'Código de comunidad incorrecto';
    end if;
    v_status := 'active';
  elsif v_community.join_mode = 'open' then
    v_status := 'active';
  else
    v_status := 'pending';
  end if;

  insert into public.community_members(community_id,user_id,role,status,joined_at,updated_at)
  values(p_community_id,v_user,'member',v_status,case when v_status='active' then now() else null end,now())
  on conflict (community_id,user_id) do update set
    status = excluded.status,
    role = case when public.community_members.role='owner' then 'owner' else 'member' end,
    joined_at = case when excluded.status='active' then coalesce(public.community_members.joined_at,now()) else null end,
    updated_at = now();

  return v_status;
end;
$$;

grant execute on function public.request_community_join(uuid,text) to authenticated;

create or replace function public.leave_community(p_community_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists(select 1 from public.community_members where community_id=p_community_id and user_id=auth.uid() and role='owner') then
    raise exception 'El propietario debe transferir la comunidad antes de salir';
  end if;
  update public.community_members set status='left',updated_at=now()
  where community_id=p_community_id and user_id=auth.uid();
  return found;
end;
$$;

grant execute on function public.leave_community(uuid) to authenticated;

create or replace function public.set_community_invite_code(p_community_id uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_community_admin(p_community_id,auth.uid()) then raise exception 'Sin permiso'; end if;
  if char_length(trim(coalesce(p_code,''))) < 4 then raise exception 'El código debe tener al menos 4 caracteres'; end if;
  insert into public.community_invite_codes(community_id,code_hash,updated_by,updated_at)
  values(p_community_id,crypt(trim(p_code),gen_salt('bf')),auth.uid(),now())
  on conflict (community_id) do update set code_hash=excluded.code_hash,updated_by=auth.uid(),updated_at=now();
  update public.communities set join_mode='code' where id=p_community_id;
  return true;
end;
$$;

grant execute on function public.set_community_invite_code(uuid,text) to authenticated;

-- Crea la comunidad y el código dentro de una misma transacción.
create or replace function public.create_community_request(
  p_name text,
  p_type text default 'neighborhood',
  p_zone text default null,
  p_description text default null,
  p_visibility text default 'public',
  p_join_mode text default 'request',
  p_school_level text default null,
  p_invite_code text default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
  v_initial_mode text;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  v_initial_mode := case when p_join_mode='code' then 'request' else p_join_mode end;

  insert into public.communities(name,type,zone,description,visibility,join_mode,school_level,owner_id)
  values(trim(p_name),p_type,nullif(trim(coalesce(p_zone,'')),''),nullif(trim(coalesce(p_description,'')),''),p_visibility,v_initial_mode,p_school_level,auth.uid())
  returning id into v_id;

  if p_join_mode='code' then
    perform public.set_community_invite_code(v_id,p_invite_code);
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_community_request(text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.review_community_membership(
  p_community_id uuid,
  p_user_id uuid,
  p_status text,
  p_role text default 'member'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_community_admin(p_community_id,auth.uid()) then raise exception 'Sin permiso'; end if;
  if p_status not in ('active','rejected','blocked') then raise exception 'Estado inválido'; end if;
  if p_role not in ('admin','moderator','teacher','parent','student','member') then raise exception 'Rol inválido'; end if;
  update public.community_members
  set status=p_status,role=p_role,joined_at=case when p_status='active' then coalesce(joined_at,now()) else joined_at end,updated_at=now()
  where community_id=p_community_id and user_id=p_user_id and role<>'owner';
  return found;
end;
$$;

grant execute on function public.review_community_membership(uuid,uuid,text,text) to authenticated;

-- Extrae de forma segura el UUID de comunidad desde community-files/<community_id>/<user_id>/archivo.
create or replace function public.storage_community_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  raw_id text;
begin
  raw_id := (storage.foldername(p_name))[1];
  if raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return raw_id::uuid;
  end if;
  return null;
exception when others then
  return null;
end;
$$;

-- =========================================================
-- 5. RLS
-- =========================================================
alter table public.communities enable row level security;
alter table public.community_invite_codes enable row level security;
alter table public.community_members enable row level security;
alter table public.community_announcements enable row level security;
alter table public.community_events enable row level security;
alter table public.school_rooms enable row level security;
alter table public.school_room_members enable row level security;
alter table public.community_documents enable row level security;

-- Comunidades públicas activas se descubren; privadas solo por membresía/propiedad/admin.
drop policy if exists "Communities visible" on public.communities;
create policy "Communities visible" on public.communities
for select to anon, authenticated
using (
  (status='active' and visibility='public')
  or owner_id=auth.uid()
  or public.is_community_member(id,auth.uid())
  or public.is_admin(auth.uid())
);

drop policy if exists "Communities create authenticated" on public.communities;
create policy "Communities create authenticated" on public.communities
for insert to authenticated
with check (owner_id=auth.uid());

drop policy if exists "Communities update managers" on public.communities;
create policy "Communities update managers" on public.communities
for update to authenticated
using (public.is_community_admin(id,auth.uid()))
with check (public.is_community_admin(id,auth.uid()));

-- Los códigos nunca se leen desde el navegador.
drop policy if exists "Invite codes no direct read" on public.community_invite_codes;
create policy "Invite codes no direct read" on public.community_invite_codes
for select to authenticated using (false);

-- Miembros: cada usuario ve su membresía; miembros activos ven miembros activos; administradores ven todo.
drop policy if exists "Community members visible" on public.community_members;
create policy "Community members visible" on public.community_members
for select to authenticated
using (
  user_id=auth.uid()
  or (status='active' and public.is_community_member(community_id,auth.uid()))
  or public.is_community_admin(community_id,auth.uid())
);

drop policy if exists "Community members manager insert" on public.community_members;
create policy "Community members manager insert" on public.community_members
for insert to authenticated
with check (public.is_community_admin(community_id,auth.uid()));

drop policy if exists "Community members manager update" on public.community_members;
create policy "Community members manager update" on public.community_members
for update to authenticated
using (public.is_community_admin(community_id,auth.uid()))
with check (public.is_community_admin(community_id,auth.uid()));

-- Comunicados.
drop policy if exists "Announcements visible" on public.community_announcements;
create policy "Announcements visible" on public.community_announcements
for select to anon, authenticated
using (
  status='published' and (
    (audience='public' and exists(select 1 from public.communities c where c.id=community_id and c.status='active' and c.visibility='public'))
    or public.is_community_member(community_id,auth.uid())
    or public.is_community_admin(community_id,auth.uid())
  )
);

drop policy if exists "Announcements staff create" on public.community_announcements;
create policy "Announcements staff create" on public.community_announcements
for insert to authenticated
with check (author_id=auth.uid() and public.is_community_staff(community_id,auth.uid()));

drop policy if exists "Announcements author manage" on public.community_announcements;
create policy "Announcements author manage" on public.community_announcements
for update to authenticated
using (author_id=auth.uid() or public.is_community_admin(community_id,auth.uid()))
with check (author_id=auth.uid() or public.is_community_admin(community_id,auth.uid()));

drop policy if exists "Announcements author delete" on public.community_announcements;
create policy "Announcements author delete" on public.community_announcements
for delete to authenticated
using (author_id=auth.uid() or public.is_community_admin(community_id,auth.uid()));

-- Eventos.
drop policy if exists "Events visible" on public.community_events;
create policy "Events visible" on public.community_events
for select to anon, authenticated
using (
  status='published' and (
    (audience='public' and exists(select 1 from public.communities c where c.id=community_id and c.status='active' and c.visibility='public'))
    or public.is_community_member(community_id,auth.uid())
    or public.is_community_admin(community_id,auth.uid())
  )
);

drop policy if exists "Events staff create" on public.community_events;
create policy "Events staff create" on public.community_events
for insert to authenticated
with check (author_id=auth.uid() and public.is_community_staff(community_id,auth.uid()));

drop policy if exists "Events author manage" on public.community_events;
create policy "Events author manage" on public.community_events
for update to authenticated
using (author_id=auth.uid() or public.is_community_admin(community_id,auth.uid()))
with check (author_id=auth.uid() or public.is_community_admin(community_id,auth.uid()));

-- Aulas del mismo colegio/comunidad.
drop policy if exists "School rooms member read" on public.school_rooms;
create policy "School rooms member read" on public.school_rooms
for select to authenticated
using (public.is_community_member(community_id,auth.uid()) or public.is_community_admin(community_id,auth.uid()));

drop policy if exists "School rooms staff create" on public.school_rooms;
create policy "School rooms staff create" on public.school_rooms
for insert to authenticated
with check (created_by=auth.uid() and public.is_community_staff(community_id,auth.uid()));

drop policy if exists "School rooms staff update" on public.school_rooms;
create policy "School rooms staff update" on public.school_rooms
for update to authenticated
using (public.is_community_staff(community_id,auth.uid()))
with check (public.is_community_staff(community_id,auth.uid()));

drop policy if exists "Room members visible" on public.school_room_members;
create policy "Room members visible" on public.school_room_members
for select to authenticated
using (
  user_id=auth.uid()
  or exists(
    select 1 from public.school_rooms r
    where r.id=room_id
      and (public.is_community_member(r.community_id,auth.uid()) or public.is_community_staff(r.community_id,auth.uid()))
  )
);

drop policy if exists "Room members staff manage" on public.school_room_members;
create policy "Room members staff manage" on public.school_room_members
for all to authenticated
using (exists(select 1 from public.school_rooms r where r.id=room_id and public.is_community_staff(r.community_id,auth.uid())))
with check (exists(select 1 from public.school_rooms r where r.id=room_id and public.is_community_staff(r.community_id,auth.uid())));

-- Documentos.
drop policy if exists "Community documents member read" on public.community_documents;
create policy "Community documents member read" on public.community_documents
for select to authenticated
using (public.is_community_member(community_id,auth.uid()) or public.is_community_admin(community_id,auth.uid()));

drop policy if exists "Community documents member upload metadata" on public.community_documents;
create policy "Community documents member upload metadata" on public.community_documents
for insert to authenticated
with check (uploader_id=auth.uid() and public.is_community_member(community_id,auth.uid()));

drop policy if exists "Community documents owner delete" on public.community_documents;
create policy "Community documents owner delete" on public.community_documents
for delete to authenticated
using (uploader_id=auth.uid() or public.is_community_admin(community_id,auth.uid()));

-- =========================================================
-- 6. STORAGE PRIVADO DE COMUNIDAD
-- =========================================================
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'community-files','community-files',false,20971520,
  array[
    'image/jpeg','image/png','image/webp','application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
on conflict (id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Community files member read" on storage.objects;
create policy "Community files member read" on storage.objects
for select to authenticated
using (
  bucket_id='community-files'
  and public.is_community_member(public.storage_community_id(name),auth.uid())
);

drop policy if exists "Community files member upload" on storage.objects;
create policy "Community files member upload" on storage.objects
for insert to authenticated
with check (
  bucket_id='community-files'
  and public.is_community_member(public.storage_community_id(name),auth.uid())
  and (storage.foldername(name))[2]=auth.uid()::text
);

drop policy if exists "Community files owner delete" on storage.objects;
create policy "Community files owner delete" on storage.objects
for delete to authenticated
using (
  bucket_id='community-files'
  and (
    (storage.foldername(name))[2]=auth.uid()::text
    or public.is_community_admin(public.storage_community_id(name),auth.uid())
  )
);

-- =========================================================
-- 7. PERMISOS API
-- =========================================================
grant select on public.communities, public.community_announcements, public.community_events to anon;
grant select,insert,update,delete on public.communities to authenticated;
grant select,insert,update,delete on public.community_members to authenticated;
grant select,insert,update,delete on public.community_announcements to authenticated;
grant select,insert,update,delete on public.community_events to authenticated;
grant select,insert,update,delete on public.school_rooms to authenticated;
grant select,insert,update,delete on public.school_room_members to authenticated;
grant select,insert,update,delete on public.community_documents to authenticated;
grant select on public.community_invite_codes to authenticated;

-- =========================================================
-- 8. REALTIME
-- =========================================================
do $$
begin
  begin alter publication supabase_realtime add table public.community_announcements; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.community_events; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.community_members; exception when duplicate_object then null; end;
end $$;

-- Fin de Etapa 11.

-- 9. VISIBILIDAD MÍNIMA DE PERFILES ENTRE MIEMBROS DE UNA MISMA COMUNIDAD
create or replace function public.shares_active_community(
  p_profile_id uuid,
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
    from public.community_members target
    join public.community_members mine on mine.community_id = target.community_id
    where target.user_id = p_profile_id
      and target.status = 'active'
      and mine.user_id = p_user_id
      and mine.status = 'active'
  );
$$;

grant execute on function public.shares_active_community(uuid,uuid) to authenticated;

drop policy if exists "Profiles read own" on public.profiles;
drop policy if exists "Profiles read own or shared community" on public.profiles;
create policy "Profiles read own or shared community" on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.is_admin(auth.uid())
  or public.shares_active_community(id,auth.uid())
);
