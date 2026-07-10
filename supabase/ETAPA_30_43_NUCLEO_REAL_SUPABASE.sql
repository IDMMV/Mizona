-- =========================================================
-- MiZona Enterprise V8 - Etapa 30.43
-- Núcleo real oficial en Supabase
-- =========================================================
-- Ejecutar en Supabase SQL Editor.
-- Este script evita "create policy if not exists" porque PostgreSQL no lo acepta.
-- Puede ejecutarse nuevamente: elimina políticas antiguas con DROP POLICY IF EXISTS.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. Perfiles y roles
-- =========================================================

create table if not exists public.mz_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  avatar_url text,
  phone text,
  status_text text default 'Disponible',
  role text not null default 'adult',
  account_type text default 'adult',
  is_active boolean default true,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mz_roles (
  id text primary key,
  label text not null,
  description text,
  can_invite boolean default false,
  can_manage_modules boolean default false,
  is_admin boolean default false,
  created_at timestamptz default now()
);

insert into public.mz_roles (id,label,description,can_invite,can_manage_modules,is_admin)
values
('super_admin','Super administrador','Control total de MiZona.',true,true,true),
('platform_admin','Administrador de plataforma','Administra usuarios, módulos y comunidades.',true,true,true),
('adult','Adulto','Usuario adulto estándar.',true,false,false),
('parent','Padre de familia','Perfil familiar/comité/colegio.',true,false,false),
('student','Alumno protegido','Perfil protegido para aprendizaje.',false,false,false),
('business_owner','Dueño de negocio','Administra negocio, pedidos y productos.',true,false,false),
('business_worker','Trabajador de negocio','Opera caja, cocina, pedidos o inventario.',false,false,false),
('driver','Conductor / repartidor','Opera Ride y Delivery.',false,false,false),
('chat_guest','Invitado solo chat','Acceso limitado a chat.',false,false,false),
('temporary_guest','Invitado temporal','Acceso temporal y limitado.',false,false,false)
on conflict (id) do update set
label = excluded.label,
description = excluded.description,
can_invite = excluded.can_invite,
can_manage_modules = excluded.can_manage_modules,
is_admin = excluded.is_admin;

-- =========================================================
-- 2. Módulos y permisos por usuario
-- =========================================================

create table if not exists public.mz_modules (
  id text primary key,
  label text not null,
  description text,
  category text default 'general',
  status text default 'active',
  sort_order integer default 100,
  created_at timestamptz default now()
);

insert into public.mz_modules (id,label,description,category,status,sort_order)
values
('panel','Mi Panel','Resumen principal del usuario.','core','active',1),
('community','Mi Comunidad','Comunidades, colegios, grupos y zonas.','core','active',2),
('chat','MiZona Chat','Mensajería y acciones dentro del chat.','core','active',3),
('committees','Comités','Gestión de comités, cuotas, pagos y documentos.','management','active',4),
('marketplace','Marketplace / Mi Tienda','Productos, servicios, proveedores y pedidos.','commerce','active',5),
('business','MiZona Business','Caja, POS, pedidos, cocina, stock y reportes.','commerce','active',6),
('ride','MiZona Ride','Movilidad, conductores, viajes y seguimiento.','mobility','active',7),
('rideDelivery','Zona Ride Delivery','Delivery de productos, mandados y envíos.','mobility','soon',8),
('campus','CampusHugo','Cursos, aprendizaje, tareas y certificados.','education','active',9),
('benefits','Beneficios','Promociones, campañas y oportunidades.','commerce','active',10),
('transfer','MiZona Transfer','Archivos temporales y enlaces compartibles.','files','active',11),
('notifications','Notificaciones','Centro de avisos internos.','core','active',12),
('admin','Centro de Control','Administración general de módulos y usuarios.','admin','active',90),
('architecture','Arquitectura','Supabase, Firebase y configuración técnica.','admin','active',91),
('settings','Configuración','Cuenta, preferencias y ajustes.','core','active',99)
on conflict (id) do update set
label = excluded.label,
description = excluded.description,
category = excluded.category,
status = excluded.status,
sort_order = excluded.sort_order;

create table if not exists public.mz_role_module_permissions (
  role_id text references public.mz_roles(id) on delete cascade,
  module_id text references public.mz_modules(id) on delete cascade,
  can_view boolean default true,
  can_create boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  can_export boolean default false,
  can_admin boolean default false,
  created_at timestamptz default now(),
  primary key (role_id,module_id)
);

create table if not exists public.mz_user_module_permissions (
  user_id uuid references auth.users(id) on delete cascade,
  module_id text references public.mz_modules(id) on delete cascade,
  can_view boolean default true,
  can_create boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  can_export boolean default false,
  can_admin boolean default false,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id,module_id)
);

-- Permisos base por rol.
insert into public.mz_role_module_permissions (role_id,module_id,can_view,can_create,can_edit,can_delete,can_export,can_admin)
select 'super_admin', id, true, true, true, true, true, true from public.mz_modules
on conflict (role_id,module_id) do update set can_view=true, can_create=true, can_edit=true, can_delete=true, can_export=true, can_admin=true;

insert into public.mz_role_module_permissions (role_id,module_id,can_view,can_create,can_edit,can_delete,can_export,can_admin)
select 'platform_admin', id, true, true, true, true, true, true from public.mz_modules
where id in ('panel','community','chat','committees','marketplace','business','ride','rideDelivery','benefits','notifications','admin','architecture','settings')
on conflict (role_id,module_id) do update set can_view=true, can_create=true, can_edit=true, can_delete=true, can_export=true, can_admin=true;

insert into public.mz_role_module_permissions (role_id,module_id,can_view,can_create,can_edit,can_delete,can_export,can_admin)
values
('adult','panel',true,false,false,false,false,false),
('adult','community',true,true,false,false,false,false),
('adult','chat',true,true,false,false,false,false),
('adult','committees',true,true,false,false,true,false),
('adult','marketplace',true,true,false,false,false,false),
('adult','ride',true,true,false,false,false,false),
('adult','benefits',true,false,false,false,false,false),
('adult','settings',true,true,true,false,false,false),
('parent','panel',true,false,false,false,false,false),
('parent','community',true,true,false,false,false,false),
('parent','chat',true,true,false,false,false,false),
('parent','committees',true,true,false,false,true,false),
('parent','marketplace',true,true,false,false,false,false),
('parent','ride',true,true,false,false,false,false),
('parent','campus',true,true,false,false,false,false),
('parent','settings',true,true,true,false,false,false),
('business_owner','panel',true,false,false,false,false,false),
('business_owner','chat',true,true,false,false,false,false),
('business_owner','marketplace',true,true,true,false,true,false),
('business_owner','business',true,true,true,false,true,false),
('business_owner','settings',true,true,true,false,false,false),
('business_worker','panel',true,false,false,false,false,false),
('business_worker','chat',true,true,false,false,false,false),
('business_worker','business',true,true,false,false,false,false),
('driver','panel',true,false,false,false,false,false),
('driver','chat',true,true,false,false,false,false),
('driver','ride',true,true,false,false,false,false),
('driver','rideDelivery',true,true,false,false,false,false),
('chat_guest','chat',true,true,false,false,false,false),
('chat_guest','settings',true,false,false,false,false,false),
('temporary_guest','chat',true,true,false,false,false,false)
on conflict (role_id,module_id) do update set
can_view=excluded.can_view,
can_create=excluded.can_create,
can_edit=excluded.can_edit,
can_delete=excluded.can_delete,
can_export=excluded.can_export,
can_admin=excluded.can_admin;

-- =========================================================
-- 3. Comunidades y miembros
-- =========================================================

create table if not exists public.mz_communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text default 'community',
  zone text,
  description text,
  visibility text default 'public',
  join_mode text default 'request',
  status text default 'active',
  invite_code text unique default upper(substr(encode(gen_random_bytes(8),'hex'),1,8)),
  cover_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mz_community_members (
  community_id uuid references public.mz_communities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  member_role text default 'member',
  status text default 'active',
  joined_at timestamptz default now(),
  primary key (community_id,user_id)
);

create table if not exists public.mz_community_photos (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.mz_communities(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  title text,
  file_url text,
  created_at timestamptz default now()
);

-- =========================================================
-- 4. Chat base real
-- =========================================================

create table if not exists public.mz_conversations (
  id uuid primary key default gen_random_uuid(),
  type text default 'direct',
  title text,
  community_id uuid references public.mz_communities(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mz_conversation_members (
  conversation_id uuid references public.mz_conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  member_role text default 'member',
  muted boolean default false,
  archived boolean default false,
  joined_at timestamptz default now(),
  primary key (conversation_id,user_id)
);

create table if not exists public.mz_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.mz_conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text,
  message_type text default 'text',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.mz_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.mz_messages(id) on delete cascade,
  file_name text,
  file_url text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

create table if not exists public.mz_chat_polls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.mz_conversations(id) on delete cascade,
  message_id uuid references public.mz_messages(id) on delete set null,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  allow_multiple boolean default false,
  is_closed boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.mz_chat_poll_votes (
  poll_id uuid references public.mz_chat_polls(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  option_index integer not null,
  created_at timestamptz default now(),
  primary key (poll_id,user_id,option_index)
);

create table if not exists public.mz_chat_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.mz_conversations(id) on delete cascade,
  message_id uuid references public.mz_messages(id) on delete set null,
  title text not null,
  starts_at timestamptz,
  location text,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- =========================================================
-- 5. Pedidos, negocios y reputación base
-- =========================================================

create table if not exists public.mz_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  community_id uuid references public.mz_communities(id) on delete set null,
  name text not null,
  category text,
  zone text,
  address text,
  phone text,
  logo_url text,
  verified boolean default false,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mz_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.mz_businesses(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) default 0,
  image_url text,
  stock integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mz_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null default ('MZ-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,10))),
  buyer_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.mz_businesses(id) on delete set null,
  conversation_id uuid references public.mz_conversations(id) on delete set null,
  status text default 'registrado',
  delivery_mode text default 'pickup',
  subtotal numeric(12,2) default 0,
  delivery_fee numeric(12,2) default 0,
  total numeric(12,2) default 0,
  payment_status text default 'pending',
  problem boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mz_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.mz_orders(id) on delete cascade,
  product_id uuid references public.mz_products(id) on delete set null,
  title text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) default 0,
  total numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists public.mz_order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.mz_orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.mz_provider_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.mz_orders(id) on delete cascade,
  business_id uuid references public.mz_businesses(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  stars integer check (stars between 1 and 5),
  comment text,
  problem boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.mz_claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.mz_orders(id) on delete set null,
  community_id uuid references public.mz_communities(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.mz_businesses(id) on delete set null,
  reason text not null,
  detail text,
  evidence_url text,
  status text default 'open',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 6. Comité base real
-- =========================================================

create table if not exists public.mz_committee_participants (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.mz_communities(id) on delete cascade,
  student_name text,
  guardian_name text,
  phone text,
  dni text,
  address text,
  role text default 'participant',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.mz_committee_charges (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.mz_communities(id) on delete cascade,
  title text not null,
  category text default 'Cuota',
  amount numeric(12,2) default 0,
  due_date date,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.mz_committee_payments (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.mz_communities(id) on delete cascade,
  participant_id uuid references public.mz_committee_participants(id) on delete set null,
  charge_id uuid references public.mz_committee_charges(id) on delete set null,
  amount numeric(12,2) default 0,
  payment_date date default current_date,
  method text,
  operation_code text,
  receipt_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.mz_committee_expenses (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.mz_communities(id) on delete cascade,
  charge_id uuid references public.mz_committee_charges(id) on delete set null,
  concept text not null,
  amount numeric(12,2) default 0,
  expense_date date default current_date,
  responsible text,
  detail text,
  receipt_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.mz_committee_documents (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.mz_communities(id) on delete cascade,
  doc_type text default 'document',
  title text not null,
  file_url text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.mz_committee_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.mz_communities(id) on delete cascade,
  title text not null,
  starts_at timestamptz,
  location text,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- =========================================================
-- 7. Notificaciones, archivos y Firebase
-- =========================================================

create table if not exists public.mz_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text default 'info',
  payload jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.mz_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  community_id uuid references public.mz_communities(id) on delete set null,
  bucket text default 'mizona',
  file_path text not null,
  file_url text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.mz_firebase_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_token text not null,
  platform text default 'web',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 8. Funciones útiles
-- =========================================================

create or replace function public.mz_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mz_profiles_touch on public.mz_profiles;
create trigger mz_profiles_touch before update on public.mz_profiles for each row execute function public.mz_touch_updated_at();

drop trigger if exists mz_communities_touch on public.mz_communities;
create trigger mz_communities_touch before update on public.mz_communities for each row execute function public.mz_touch_updated_at();

drop trigger if exists mz_businesses_touch on public.mz_businesses;
create trigger mz_businesses_touch before update on public.mz_businesses for each row execute function public.mz_touch_updated_at();

drop trigger if exists mz_products_touch on public.mz_products;
create trigger mz_products_touch before update on public.mz_products for each row execute function public.mz_touch_updated_at();

drop trigger if exists mz_orders_touch on public.mz_orders;
create trigger mz_orders_touch before update on public.mz_orders for each row execute function public.mz_touch_updated_at();

drop trigger if exists mz_claims_touch on public.mz_claims;
create trigger mz_claims_touch before update on public.mz_claims for each row execute function public.mz_touch_updated_at();

create or replace function public.mz_is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.mz_profiles p
    join public.mz_roles r on r.id = p.role
    where p.id = auth.uid()
    and r.is_admin = true
  );
$$;

create or replace function public.mz_is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.mz_conversation_members cm
    where cm.conversation_id = p_conversation_id
    and cm.user_id = auth.uid()
  );
$$;

create or replace function public.mz_is_community_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.mz_community_members cm
    where cm.community_id = p_community_id
    and cm.user_id = auth.uid()
    and cm.status = 'active'
  );
$$;

-- =========================================================
-- 9. Índices
-- =========================================================

create index if not exists idx_mz_profiles_role on public.mz_profiles(role);
create index if not exists idx_mz_communities_owner on public.mz_communities(owner_id);
create index if not exists idx_mz_community_members_user on public.mz_community_members(user_id);
create index if not exists idx_mz_messages_conversation_created on public.mz_messages(conversation_id, created_at desc);
create index if not exists idx_mz_conversation_members_user on public.mz_conversation_members(user_id);
create index if not exists idx_mz_orders_buyer on public.mz_orders(buyer_id);
create index if not exists idx_mz_orders_business on public.mz_orders(business_id);
create index if not exists idx_mz_notifications_user_created on public.mz_notifications(user_id, created_at desc);
create index if not exists idx_mz_committee_participants_community on public.mz_committee_participants(community_id);

-- =========================================================
-- 10. RLS
-- =========================================================

alter table public.mz_profiles enable row level security;
alter table public.mz_roles enable row level security;
alter table public.mz_modules enable row level security;
alter table public.mz_role_module_permissions enable row level security;
alter table public.mz_user_module_permissions enable row level security;
alter table public.mz_communities enable row level security;
alter table public.mz_community_members enable row level security;
alter table public.mz_community_photos enable row level security;
alter table public.mz_conversations enable row level security;
alter table public.mz_conversation_members enable row level security;
alter table public.mz_messages enable row level security;
alter table public.mz_message_attachments enable row level security;
alter table public.mz_chat_polls enable row level security;
alter table public.mz_chat_poll_votes enable row level security;
alter table public.mz_chat_events enable row level security;
alter table public.mz_businesses enable row level security;
alter table public.mz_products enable row level security;
alter table public.mz_orders enable row level security;
alter table public.mz_order_items enable row level security;
alter table public.mz_order_status_logs enable row level security;
alter table public.mz_provider_reviews enable row level security;
alter table public.mz_claims enable row level security;
alter table public.mz_committee_participants enable row level security;
alter table public.mz_committee_charges enable row level security;
alter table public.mz_committee_payments enable row level security;
alter table public.mz_committee_expenses enable row level security;
alter table public.mz_committee_documents enable row level security;
alter table public.mz_committee_events enable row level security;
alter table public.mz_notifications enable row level security;
alter table public.mz_files enable row level security;
alter table public.mz_firebase_devices enable row level security;

-- =========================================================
-- 11. Políticas RLS
-- =========================================================

-- Perfiles
drop policy if exists "mz_profiles_select_authenticated" on public.mz_profiles;
create policy "mz_profiles_select_authenticated" on public.mz_profiles
for select to authenticated using (true);

drop policy if exists "mz_profiles_insert_self" on public.mz_profiles;
create policy "mz_profiles_insert_self" on public.mz_profiles
for insert to authenticated with check (id = auth.uid());

drop policy if exists "mz_profiles_update_self_or_admin" on public.mz_profiles;
create policy "mz_profiles_update_self_or_admin" on public.mz_profiles
for update to authenticated using (id = auth.uid() or public.mz_is_admin())
with check (id = auth.uid() or public.mz_is_admin());

-- Catálogos
drop policy if exists "mz_roles_select" on public.mz_roles;
create policy "mz_roles_select" on public.mz_roles for select to authenticated using (true);

drop policy if exists "mz_modules_select" on public.mz_modules;
create policy "mz_modules_select" on public.mz_modules for select to authenticated using (true);

drop policy if exists "mz_role_permissions_select" on public.mz_role_module_permissions;
create policy "mz_role_permissions_select" on public.mz_role_module_permissions for select to authenticated using (true);

drop policy if exists "mz_user_permissions_self_admin" on public.mz_user_module_permissions;
create policy "mz_user_permissions_self_admin" on public.mz_user_module_permissions
for select to authenticated using (user_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_user_permissions_admin_write" on public.mz_user_module_permissions;
create policy "mz_user_permissions_admin_write" on public.mz_user_module_permissions
for all to authenticated using (public.mz_is_admin()) with check (public.mz_is_admin());

-- Comunidades
drop policy if exists "mz_communities_select_public_member_admin" on public.mz_communities;
create policy "mz_communities_select_public_member_admin" on public.mz_communities
for select to authenticated using (visibility = 'public' or owner_id = auth.uid() or public.mz_is_community_member(id) or public.mz_is_admin());

drop policy if exists "mz_communities_insert_auth" on public.mz_communities;
create policy "mz_communities_insert_auth" on public.mz_communities
for insert to authenticated with check (owner_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_communities_update_owner_admin" on public.mz_communities;
create policy "mz_communities_update_owner_admin" on public.mz_communities
for update to authenticated using (owner_id = auth.uid() or public.mz_is_admin())
with check (owner_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_community_members_select_related" on public.mz_community_members;
create policy "mz_community_members_select_related" on public.mz_community_members
for select to authenticated using (user_id = auth.uid() or public.mz_is_community_member(community_id) or public.mz_is_admin());

drop policy if exists "mz_community_members_insert_self_owner_admin" on public.mz_community_members;
create policy "mz_community_members_insert_self_owner_admin" on public.mz_community_members
for insert to authenticated with check (user_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_community_photos_member" on public.mz_community_photos;
create policy "mz_community_photos_member" on public.mz_community_photos
for all to authenticated using (public.mz_is_community_member(community_id) or public.mz_is_admin())
with check (public.mz_is_community_member(community_id) or public.mz_is_admin());

-- Chat
drop policy if exists "mz_conversations_member_select" on public.mz_conversations;
create policy "mz_conversations_member_select" on public.mz_conversations
for select to authenticated using (public.mz_is_conversation_member(id) or created_by = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_conversations_insert_auth" on public.mz_conversations;
create policy "mz_conversations_insert_auth" on public.mz_conversations
for insert to authenticated with check (created_by = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_conversation_members_self" on public.mz_conversation_members;
create policy "mz_conversation_members_self" on public.mz_conversation_members
for select to authenticated using (user_id = auth.uid() or public.mz_is_conversation_member(conversation_id) or public.mz_is_admin());

drop policy if exists "mz_conversation_members_insert_auth" on public.mz_conversation_members;
create policy "mz_conversation_members_insert_auth" on public.mz_conversation_members
for insert to authenticated with check (user_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_messages_member_select" on public.mz_messages;
create policy "mz_messages_member_select" on public.mz_messages
for select to authenticated using (public.mz_is_conversation_member(conversation_id) or public.mz_is_admin());

drop policy if exists "mz_messages_member_insert" on public.mz_messages;
create policy "mz_messages_member_insert" on public.mz_messages
for insert to authenticated with check (sender_id = auth.uid() and public.mz_is_conversation_member(conversation_id));

drop policy if exists "mz_attachments_member" on public.mz_message_attachments;
create policy "mz_attachments_member" on public.mz_message_attachments
for select to authenticated using (
  exists (
    select 1 from public.mz_messages m
    where m.id = mz_message_attachments.message_id
    and (public.mz_is_conversation_member(m.conversation_id) or public.mz_is_admin())
  )
);

-- Polls/events in chat
drop policy if exists "mz_chat_polls_member" on public.mz_chat_polls;
create policy "mz_chat_polls_member" on public.mz_chat_polls
for all to authenticated using (public.mz_is_conversation_member(conversation_id) or public.mz_is_admin())
with check (public.mz_is_conversation_member(conversation_id) or public.mz_is_admin());

drop policy if exists "mz_chat_poll_votes_member" on public.mz_chat_poll_votes;
create policy "mz_chat_poll_votes_member" on public.mz_chat_poll_votes
for all to authenticated using (user_id = auth.uid() or public.mz_is_admin())
with check (user_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_chat_events_member" on public.mz_chat_events;
create policy "mz_chat_events_member" on public.mz_chat_events
for all to authenticated using (public.mz_is_conversation_member(conversation_id) or public.mz_is_admin())
with check (public.mz_is_conversation_member(conversation_id) or public.mz_is_admin());

-- Business/products
drop policy if exists "mz_businesses_select_active" on public.mz_businesses;
create policy "mz_businesses_select_active" on public.mz_businesses
for select to authenticated using (status = 'active' or owner_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_businesses_owner_write" on public.mz_businesses;
create policy "mz_businesses_owner_write" on public.mz_businesses
for all to authenticated using (owner_id = auth.uid() or public.mz_is_admin())
with check (owner_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_products_select_active" on public.mz_products;
create policy "mz_products_select_active" on public.mz_products
for select to authenticated using (is_active = true or public.mz_is_admin());

drop policy if exists "mz_products_business_owner_write" on public.mz_products;
create policy "mz_products_business_owner_write" on public.mz_products
for all to authenticated using (
  exists (select 1 from public.mz_businesses b where b.id = mz_products.business_id and (b.owner_id = auth.uid() or public.mz_is_admin()))
)
with check (
  exists (select 1 from public.mz_businesses b where b.id = mz_products.business_id and (b.owner_id = auth.uid() or public.mz_is_admin()))
);

-- Orders
drop policy if exists "mz_orders_select_related" on public.mz_orders;
create policy "mz_orders_select_related" on public.mz_orders
for select to authenticated using (
  buyer_id = auth.uid()
  or public.mz_is_admin()
  or exists (select 1 from public.mz_businesses b where b.id = mz_orders.business_id and b.owner_id = auth.uid())
);

drop policy if exists "mz_orders_insert_buyer" on public.mz_orders;
create policy "mz_orders_insert_buyer" on public.mz_orders
for insert to authenticated with check (buyer_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_orders_update_related" on public.mz_orders;
create policy "mz_orders_update_related" on public.mz_orders
for update to authenticated using (
  buyer_id = auth.uid()
  or public.mz_is_admin()
  or exists (select 1 from public.mz_businesses b where b.id = mz_orders.business_id and b.owner_id = auth.uid())
);

drop policy if exists "mz_order_items_select_related" on public.mz_order_items;
create policy "mz_order_items_select_related" on public.mz_order_items
for select to authenticated using (
  exists (
    select 1 from public.mz_orders o
    where o.id = mz_order_items.order_id
    and (o.buyer_id = auth.uid() or public.mz_is_admin() or exists (select 1 from public.mz_businesses b where b.id = o.business_id and b.owner_id = auth.uid()))
  )
);

drop policy if exists "mz_order_items_insert_buyer" on public.mz_order_items;
create policy "mz_order_items_insert_buyer" on public.mz_order_items
for insert to authenticated with check (
  exists (select 1 from public.mz_orders o where o.id = mz_order_items.order_id and (o.buyer_id = auth.uid() or public.mz_is_admin()))
);

drop policy if exists "mz_order_logs_related" on public.mz_order_status_logs;
create policy "mz_order_logs_related" on public.mz_order_status_logs
for all to authenticated using (
  exists (
    select 1 from public.mz_orders o
    where o.id = mz_order_status_logs.order_id
    and (o.buyer_id = auth.uid() or public.mz_is_admin() or exists (select 1 from public.mz_businesses b where b.id = o.business_id and b.owner_id = auth.uid()))
  )
)
with check (changed_by = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_reviews_related" on public.mz_provider_reviews;
create policy "mz_reviews_related" on public.mz_provider_reviews
for all to authenticated using (buyer_id = auth.uid() or public.mz_is_admin())
with check (buyer_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_claims_related" on public.mz_claims;
create policy "mz_claims_related" on public.mz_claims
for all to authenticated using (created_by = auth.uid() or target_user_id = auth.uid() or public.mz_is_admin())
with check (created_by = auth.uid() or public.mz_is_admin());

-- Committee: community members/admin only
drop policy if exists "mz_committee_participants_member" on public.mz_committee_participants;
create policy "mz_committee_participants_member" on public.mz_committee_participants
for all to authenticated using (public.mz_is_community_member(community_id) or public.mz_is_admin())
with check (public.mz_is_community_member(community_id) or public.mz_is_admin());

drop policy if exists "mz_committee_charges_member" on public.mz_committee_charges;
create policy "mz_committee_charges_member" on public.mz_committee_charges
for all to authenticated using (public.mz_is_community_member(community_id) or public.mz_is_admin())
with check (public.mz_is_community_member(community_id) or public.mz_is_admin());

drop policy if exists "mz_committee_payments_member" on public.mz_committee_payments;
create policy "mz_committee_payments_member" on public.mz_committee_payments
for all to authenticated using (public.mz_is_community_member(community_id) or public.mz_is_admin())
with check (public.mz_is_community_member(community_id) or public.mz_is_admin());

drop policy if exists "mz_committee_expenses_member" on public.mz_committee_expenses;
create policy "mz_committee_expenses_member" on public.mz_committee_expenses
for all to authenticated using (public.mz_is_community_member(community_id) or public.mz_is_admin())
with check (public.mz_is_community_member(community_id) or public.mz_is_admin());

drop policy if exists "mz_committee_documents_member" on public.mz_committee_documents;
create policy "mz_committee_documents_member" on public.mz_committee_documents
for all to authenticated using (public.mz_is_community_member(community_id) or public.mz_is_admin())
with check (public.mz_is_community_member(community_id) or public.mz_is_admin());

drop policy if exists "mz_committee_events_member" on public.mz_committee_events;
create policy "mz_committee_events_member" on public.mz_committee_events
for all to authenticated using (public.mz_is_community_member(community_id) or public.mz_is_admin())
with check (public.mz_is_community_member(community_id) or public.mz_is_admin());

-- Notifications/files/devices
drop policy if exists "mz_notifications_owner" on public.mz_notifications;
create policy "mz_notifications_owner" on public.mz_notifications
for all to authenticated using (user_id = auth.uid() or public.mz_is_admin())
with check (user_id = auth.uid() or public.mz_is_admin());

drop policy if exists "mz_files_owner_member" on public.mz_files;
create policy "mz_files_owner_member" on public.mz_files
for all to authenticated using (owner_id = auth.uid() or public.mz_is_admin() or (community_id is not null and public.mz_is_community_member(community_id)))
with check (owner_id = auth.uid() or public.mz_is_admin() or (community_id is not null and public.mz_is_community_member(community_id)));

drop policy if exists "mz_firebase_devices_owner" on public.mz_firebase_devices;
create policy "mz_firebase_devices_owner" on public.mz_firebase_devices
for all to authenticated using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =========================================================
-- 12. Realtime recomendado
-- =========================================================

do $$
declare
  t regclass;
  tbl text;
  tables text[] := array[
    'public.mz_messages',
    'public.mz_conversations',
    'public.mz_conversation_members',
    'public.mz_orders',
    'public.mz_notifications'
  ];
begin
  foreach tbl in array tables loop
    t := tbl::regclass;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime'
      and pr.prrelid = t
    ) then
      execute format('alter publication supabase_realtime add table %s', tbl);
    end if;
  end loop;
end $$;

-- Realtime queda preparado sin duplicar tablas ya agregadas.

-- =========================================================
-- Fin Etapa 30.43
-- =========================================================
