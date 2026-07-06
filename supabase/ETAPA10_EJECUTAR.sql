-- MiZona Enterprise V8 · Etapa 10
-- Núcleo real: autenticación, perfiles, roles, términos, módulos y seguridad.
-- Ejecutar en Supabase SQL Editor después de schema.sql.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- 1) PERFIL VINCULADO A AUTH.USERS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null,
  display_name text not null,
  role text not null default 'user',
  account_type text not null default 'adult',
  zone text,
  avatar_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists account_type text not null default 'adult';
alter table public.profiles add column if not exists zone text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles alter column id drop default;
alter table public.profiles alter column username type citext using username::citext;

-- Vincula perfiles existentes/nuevos con Auth sin bloquear una migración previa.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_auth_user_fk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_auth_user_fk
      foreign key (id) references auth.users(id) on delete cascade not valid;
  end if;
end $$;

-- 2) VALIDACIÓN DE USUARIO
create or replace function public.normalize_username(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(value, '')), '[^a-zA-Z0-9_]+', '', 'g'));
$$;

create or replace function public.username_is_allowed(value text)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized text := public.normalize_username(value);
  blocked text[] := array[
    'admin','administrador','administrator','mizona','soporte','support','moderador','moderator',
    'sistema','system','oficial','official','root','null','undefined','porno','sexo','puta','puto','mierda','pendejo'
  ];
begin
  return normalized ~ '^[a-z0-9_]{4,20}$'
    and not (normalized = any(blocked))
    and normalized not like 'mizona_%'
    and normalized not like 'admin_%';
end;
$$;

create or replace function public.validate_profile_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.username := public.normalize_username(new.username);
  if not public.username_is_allowed(new.username) then
    raise exception 'Nombre de usuario inválido, reservado o no permitido';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_profile_username on public.profiles;
create trigger trg_validate_profile_username
before insert or update of username, display_name, zone on public.profiles
for each row execute function public.validate_profile_username();

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.username_is_allowed(p_username)
    and not exists (
      select 1 from public.profiles p
      where p.username = public.normalize_username(p_username)::citext
    );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- 3) TÉRMINOS Y DECLARACIONES
create table if not exists public.user_terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  unique(user_id, terms_version)
);

-- 4) CREACIÓN AUTOMÁTICA DEL PERFIL AL REGISTRARSE
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
  desired_name text;
  desired_type text;
  desired_zone text;
  accepted boolean;
  version text;
begin
  desired_username := public.normalize_username(new.raw_user_meta_data ->> 'username');
  if not public.username_is_allowed(desired_username) then
    desired_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  desired_name := trim(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'Usuario'), '@', 1)));
  desired_type := coalesce(new.raw_user_meta_data ->> 'account_type', 'adult');
  desired_zone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'zone', '')), '');
  accepted := coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false);
  version := coalesce(new.raw_user_meta_data ->> 'terms_version', '2026-07');

  insert into public.profiles (id, username, display_name, account_type, zone)
  values (new.id, desired_username, desired_name, desired_type, desired_zone)
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    account_type = excluded.account_type,
    zone = excluded.zone,
    updated_at = now();

  if accepted then
    insert into public.user_terms (user_id, terms_version)
    values (new.id, version)
    on conflict (user_id, terms_version) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- 5) ROLES Y ADMINISTRACIÓN
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id
      and role in ('admin','super_admin')
      and status = 'active'
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

create table if not exists public.app_modules (
  id text primary key,
  label text not null,
  status text not null default 'active',
  phase text not null,
  audience text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

insert into public.app_modules (id,label,status,phase,audience,sort_order,visible) values
('panel','Mi Panel','active','Base','Todos',10,true),
('community','Mi Comunidad','active','Sprint 2','Colegios, comités, clubes',20,true),
('chat','MiZona Chat','active','Sprint 2','Usuarios y aulas',30,true),
('transfer','MiZona Transfer','active','Sprint 2','Aulas y trabajos',40,true),
('benefits','Beneficios','active','Sprint 3','Todos',50,true),
('businesses','Negocios','active','Sprint 4','Todos y comercios',60,true),
('marketplace','Marketplace','active','Sprint 5','Usuarios',70,true),
('business','MiZona Business','active','Sprint 7','Negocios y emprendimientos',80,true),
('campus','CampusHugo','active','Sprint 6','Estudiantes, familias y negocios',90,true),
('ride','MiZona Ride','active','Sprint 8','Pasajeros, conductores y envíos',100,true),
('ai','IA MiZona','active','Sprint 9','Todos',110,true),
('admin','Centro de Control','active','Core','Administradores',120,true),
('blueprint','Blueprint','active','Docs','Equipo',130,true),
('settings','Configuración','active','Core','Usuario',140,true)
on conflict (id) do update set
  label = excluded.label,
  phase = excluded.phase,
  audience = excluded.audience,
  sort_order = excluded.sort_order;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.log_module_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status or old.visible is distinct from new.visible then
    new.updated_by := auth.uid();
    new.updated_at := now();
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values(auth.uid(), 'module_update', 'app_module', new.id,
      jsonb_build_object('old_status', old.status, 'new_status', new.status, 'visible', new.visible));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_module_change on public.app_modules;
create trigger trg_log_module_change
before update on public.app_modules
for each row execute function public.log_module_change();

-- 6) PREFERENCIAS DEL USUARIO
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications jsonb not null default '{"community":true,"chat":true,"offers":true,"courses":false,"ride":true}'::jsonb,
  privacy jsonb not null default '{"exact_username_only":true,"show_community":false}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 7) BÚSQUEDA EXACTA Y SEGURA DE PERFIL
create or replace function public.find_profile_exact(p_username text)
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
    and p.status = 'active'
    and (
      p.account_type <> 'student'
      or p.id = auth.uid()
      or public.is_admin(auth.uid())
    )
  limit 1;
$$;

grant execute on function public.find_profile_exact(text) to authenticated;

-- 8) ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.user_terms enable row level security;
alter table public.app_modules enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "Profiles read own" on public.profiles;
create policy "Profiles read own" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own" on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Terms own read" on public.user_terms;
create policy "Terms own read" on public.user_terms
for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Terms own insert" on public.user_terms;
create policy "Terms own insert" on public.user_terms
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Modules public read" on public.app_modules;
create policy "Modules public read" on public.app_modules
for select to anon, authenticated using (true);

drop policy if exists "Modules admin update" on public.app_modules;
create policy "Modules admin update" on public.app_modules
for update to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Audit admin read" on public.audit_logs;
create policy "Audit admin read" on public.audit_logs
for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "Preferences own manage" on public.user_preferences;
create policy "Preferences own manage" on public.user_preferences
for all to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

-- 9) STORAGE BASE
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit)
values ('mizona-private', 'mizona-private', false, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "Avatar owner upload" on storage.objects;
create policy "Avatar owner upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Avatar owner update" on storage.objects;
create policy "Avatar owner update" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Private owner manage" on storage.objects;
create policy "Private owner manage" on storage.objects
for all to authenticated
using (bucket_id = 'mizona-private' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'mizona-private' and (storage.foldername(name))[1] = auth.uid()::text);

-- 10) CONVERTIR TU PRIMER USUARIO EN SUPERADMIN
-- Después de registrarte, reemplaza el correo y ejecuta SOLO esta línea:
-- update public.profiles p set role = 'super_admin'
-- from auth.users u where p.id = u.id and lower(u.email) = lower('TU_CORREO@EJEMPLO.COM');
