-- MiZona 30.71 - Núcleo normalizado para negocios, productos y pedidos
create extension if not exists pgcrypto;

create table if not exists public.mz_businesses (
  id text primary key,
  owner_user_id uuid references auth.users(id) on delete set null,
  local_owner_id text,
  name text not null,
  trade_name text,
  category text not null default 'other',
  description text,
  zone text,
  address text,
  phone text,
  hours text,
  emoji text default '🏪',
  status text not null default 'pending' check (status in ('pending','active','paused','rejected')),
  verified boolean not null default false,
  open_now boolean not null default true,
  delivery_enabled boolean not null default false,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_business_members (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.mz_businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  local_user_id text,
  role text not null check (role in ('owner','manager','cashier','cook','waiter','staff')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id),
  unique (business_id, local_user_id)
);

create table if not exists public.mz_products (
  id text primary key,
  business_id text not null references public.mz_businesses(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price numeric(12,2) not null default 0 check (price >= 0),
  stock numeric(12,3) not null default 0,
  minimum_stock numeric(12,3) not null default 0,
  unit text not null default 'unid.',
  image_url text,
  emoji text default '📦',
  active boolean not null default true,
  track_stock boolean not null default true,
  kitchen boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_marketplace_listings (
  id text primary key,
  seller_user_id uuid references auth.users(id) on delete set null,
  local_seller_id text,
  business_id text references public.mz_businesses(id) on delete set null,
  product_id text references public.mz_products(id) on delete set null,
  category text not null default 'other',
  title text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  condition_label text,
  zone text,
  image_url text,
  emoji text default '📦',
  delivery boolean not null default false,
  negotiable boolean not null default false,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','active','paused','sold','rejected')),
  views integer not null default 0,
  contact_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_orders (
  id text primary key,
  code text not null,
  business_id text not null references public.mz_businesses(id) on delete restrict,
  buyer_user_id uuid references auth.users(id) on delete set null,
  local_buyer_id text,
  seller_user_id uuid references auth.users(id) on delete set null,
  local_seller_id text,
  source text not null default 'marketplace' check (source in ('marketplace','business','chat','pos')),
  order_type text not null default 'pickup' check (order_type in ('pickup','delivery','table')),
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','delivering','delivered','cancelled','rejected')),
  customer_name text,
  customer_phone text,
  delivery_address text,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.mz_orders(id) on delete cascade,
  product_id text references public.mz_products(id) on delete set null,
  listing_id text references public.mz_marketplace_listings(id) on delete set null,
  name text not null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists mz_businesses_status_idx on public.mz_businesses(status, category, zone);
create index if not exists mz_products_business_idx on public.mz_products(business_id, active);
create index if not exists mz_listings_status_idx on public.mz_marketplace_listings(status, category, created_at desc);
create index if not exists mz_orders_buyer_idx on public.mz_orders(buyer_user_id, created_at desc);
create index if not exists mz_orders_business_idx on public.mz_orders(business_id, status, created_at desc);

alter table public.mz_businesses enable row level security;
alter table public.mz_business_members enable row level security;
alter table public.mz_products enable row level security;
alter table public.mz_marketplace_listings enable row level security;
alter table public.mz_orders enable row level security;
alter table public.mz_order_items enable row level security;

-- Catálogo público: solo registros activos.
drop policy if exists "mz_businesses_public_read" on public.mz_businesses;
create policy "mz_businesses_public_read" on public.mz_businesses for select using (status = 'active');
drop policy if exists "mz_products_public_read" on public.mz_products;
create policy "mz_products_public_read" on public.mz_products for select using (active = true);
drop policy if exists "mz_listings_public_read" on public.mz_marketplace_listings;
create policy "mz_listings_public_read" on public.mz_marketplace_listings for select using (status = 'active' or seller_user_id = auth.uid());

-- Propietarios y miembros administran sus negocios.
drop policy if exists "mz_businesses_owner_write" on public.mz_businesses;
create policy "mz_businesses_owner_write" on public.mz_businesses for all
using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "mz_members_member_read" on public.mz_business_members;
create policy "mz_members_member_read" on public.mz_business_members for select
using (user_id = auth.uid() or exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid()));

drop policy if exists "mz_members_owner_write" on public.mz_business_members;
create policy "mz_members_owner_write" on public.mz_business_members for all
using (exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid()))
with check (exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid()));

drop policy if exists "mz_products_business_write" on public.mz_products;
create policy "mz_products_business_write" on public.mz_products for all
using (
  exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  or exists(select 1 from public.mz_business_members m where m.business_id = mz_products.business_id and m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','manager'))
)
with check (
  exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  or exists(select 1 from public.mz_business_members m where m.business_id = mz_products.business_id and m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','manager'))
);

drop policy if exists "mz_listings_seller_write" on public.mz_marketplace_listings;
create policy "mz_listings_seller_write" on public.mz_marketplace_listings for all
using (seller_user_id = auth.uid()) with check (seller_user_id = auth.uid());

-- Pedidos visibles para comprador o negocio vendedor.
drop policy if exists "mz_orders_participant_read" on public.mz_orders;
create policy "mz_orders_participant_read" on public.mz_orders for select using (
  buyer_user_id = auth.uid() or seller_user_id = auth.uid()
  or exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  or exists(select 1 from public.mz_business_members m where m.business_id = mz_orders.business_id and m.user_id = auth.uid() and m.status = 'active')
);

drop policy if exists "mz_orders_buyer_insert" on public.mz_orders;
create policy "mz_orders_buyer_insert" on public.mz_orders for insert with check (buyer_user_id = auth.uid());

drop policy if exists "mz_orders_business_update" on public.mz_orders;
create policy "mz_orders_business_update" on public.mz_orders for update using (
  seller_user_id = auth.uid()
  or exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  or exists(select 1 from public.mz_business_members m where m.business_id = mz_orders.business_id and m.user_id = auth.uid() and m.status = 'active')
);

drop policy if exists "mz_order_items_participant_read" on public.mz_order_items;
create policy "mz_order_items_participant_read" on public.mz_order_items for select using (
  exists(select 1 from public.mz_orders o where o.id = order_id and (
    o.buyer_user_id = auth.uid() or o.seller_user_id = auth.uid()
    or exists(select 1 from public.mz_businesses b where b.id = o.business_id and b.owner_user_id = auth.uid())
    or exists(select 1 from public.mz_business_members m where m.business_id = o.business_id and m.user_id = auth.uid() and m.status = 'active')
  ))
);

drop policy if exists "mz_order_items_buyer_insert" on public.mz_order_items;
create policy "mz_order_items_buyer_insert" on public.mz_order_items for insert with check (
  exists(select 1 from public.mz_orders o where o.id = order_id and o.buyer_user_id = auth.uid())
);
