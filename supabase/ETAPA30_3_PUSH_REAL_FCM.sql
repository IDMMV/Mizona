-- MiZona Etapa 30.3 - Tabla para tokens de Firebase Cloud Messaging
create table if not exists public.mz_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text,
  fcm_token text not null unique,
  device_label text,
  platform text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mz_push_tokens enable row level security;

drop policy if exists "push_tokens_select_own" on public.mz_push_tokens;
create policy "push_tokens_select_own" on public.mz_push_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "push_tokens_insert_own" on public.mz_push_tokens;
create policy "push_tokens_insert_own" on public.mz_push_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_tokens_update_own" on public.mz_push_tokens;
create policy "push_tokens_update_own" on public.mz_push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mz_push_tokens_user_idx on public.mz_push_tokens(user_id);
create index if not exists mz_push_tokens_active_idx on public.mz_push_tokens(active);
