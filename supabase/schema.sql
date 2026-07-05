-- MiZona Enterprise V8 - Sprint 1 Core Schema
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  role text default 'usuario',
  account_type text default 'general',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists modules (
  id text primary key,
  label text not null,
  path text not null,
  status text not null default 'disabled',
  audience text default 'todos',
  sort_order int default 100,
  created_at timestamptz default now()
);

create table if not exists device_limits (
  id bigint generated always as identity primary key,
  device_hash text not null,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
