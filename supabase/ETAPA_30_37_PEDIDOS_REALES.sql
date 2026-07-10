-- MiZona Enterprise V8 - Etapa 30.37
-- Base recomendada para pedidos reales Marketplace / Business.
-- Ejecutar en Supabase SQL Editor cuando se decida pasar de local a nube.

create table if not exists public.market_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null default ('MZ-' || upper(substr(gen_random_uuid()::text,1,8))),
  buyer_id uuid references auth.users(id) on delete set null,
  provider_id uuid references auth.users(id) on delete set null,
  provider_name text not null,
  delivery_mode text default 'pickup',
  status text not null default 'registrado',
  subtotal numeric(12,2) default 0,
  delivery_fee numeric(12,2) default 0,
  total numeric(12,2) default 0,
  payment_status text default 'pending',
  payment_method text default 'pending',
  problem boolean default false,
  rating numeric(3,2),
  rating_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.market_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.market_orders(id) on delete cascade,
  listing_id text,
  title text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists public.market_order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.market_orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.provider_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.market_orders(id) on delete cascade,
  provider_id uuid references auth.users(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  stars integer check (stars between 1 and 5),
  comment text,
  problem boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.provider_claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.market_orders(id) on delete set null,
  buyer_id uuid references auth.users(id) on delete set null,
  provider_id uuid references auth.users(id) on delete set null,
  reason text not null,
  detail text,
  evidence_url text,
  status text default 'open',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.provider_verifications (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references auth.users(id) on delete cascade,
  business_name text not null,
  document_type text,
  document_number text,
  phone text,
  address text,
  status text default 'pending',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.firebase_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_token text not null,
  platform text default 'web',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.market_orders enable row level security;
alter table public.market_order_items enable row level security;
alter table public.market_order_status_logs enable row level security;
alter table public.provider_reviews enable row level security;
alter table public.provider_claims enable row level security;
alter table public.provider_verifications enable row level security;
alter table public.firebase_devices enable row level security;

-- Políticas base sugeridas.
-- Ajustar según tus roles reales y tabla de perfiles.
create policy if not exists "market_orders_select_related" on public.market_orders
for select using (auth.uid() = buyer_id or auth.uid() = provider_id);

create policy if not exists "market_orders_insert_buyer" on public.market_orders
for insert with check (auth.uid() = buyer_id);

create policy if not exists "market_orders_update_related" on public.market_orders
for update using (auth.uid() = buyer_id or auth.uid() = provider_id)
with check (auth.uid() = buyer_id or auth.uid() = provider_id);

create policy if not exists "market_order_items_select_related" on public.market_order_items
for select using (
  exists (
    select 1 from public.market_orders mo
    where mo.id = market_order_items.order_id
    and (mo.buyer_id = auth.uid() or mo.provider_id = auth.uid())
  )
);

create policy if not exists "market_order_items_insert_buyer" on public.market_order_items
for insert with check (
  exists (
    select 1 from public.market_orders mo
    where mo.id = market_order_items.order_id
    and mo.buyer_id = auth.uid()
  )
);

create policy if not exists "firebase_devices_owner" on public.firebase_devices
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);
