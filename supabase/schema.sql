-- MiZona Enterprise V8 - Sprint 3 schema base
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  role text not null default 'user',
  created_at timestamptz default now()
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  zone text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  member_role text default 'member',
  created_at timestamptz default now(),
  unique(community_id, profile_id)
);

create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade,
  thread_type text not null,
  title text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references chat_threads(id) on delete cascade,
  sender_id uuid references profiles(id),
  body text,
  attachment_url text,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists transfer_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),
  community_id uuid references communities(id),
  file_name text not null,
  storage_path text not null,
  size_bytes bigint default 0,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references profiles(id),
  community_id uuid references communities(id),
  opportunity_type text not null check (opportunity_type in ('offer','job','event','campaign','coupon')),
  title text not null,
  description text,
  zone text not null,
  latitude numeric,
  longitude numeric,
  price numeric,
  previous_price numeric,
  badge text,
  starts_at timestamptz default now(),
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('draft','pending','active','paused','rejected','expired')),
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists opportunities_zone_idx on opportunities(zone);
create index if not exists opportunities_status_ends_idx on opportunities(status, ends_at);

create table if not exists opportunity_favorites (
  opportunity_id uuid references opportunities(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(opportunity_id, profile_id)
);

create table if not exists opportunity_actions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities(id) on delete cascade,
  profile_id uuid references profiles(id),
  action_type text not null check (action_type in ('view','save','share','coupon','apply','attend','contact','redeem')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table opportunities enable row level security;
alter table opportunity_favorites enable row level security;
alter table opportunity_actions enable row level security;

-- Las oportunidades activas y vigentes son visibles públicamente.
drop policy if exists "Public read active opportunities" on opportunities;
create policy "Public read active opportunities" on opportunities
for select using (status = 'active' and ends_at > now());

-- El propietario puede gestionar sus oportunidades autenticadas.
drop policy if exists "Owners manage opportunities" on opportunities;
create policy "Owners manage opportunities" on opportunities
for all using (auth.uid() = owner_profile_id) with check (auth.uid() = owner_profile_id);

-- Cada usuario gestiona sus favoritos y acciones.
drop policy if exists "Users manage favorites" on opportunity_favorites;
create policy "Users manage favorites" on opportunity_favorites
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "Users create and read own actions" on opportunity_actions;
create policy "Users create and read own actions" on opportunity_actions
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
