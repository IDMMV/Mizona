-- MiZona Enterprise V8 · Etapa 30
-- Finanzas personales privadas por usuario
-- Ejecutar una sola vez después de MiZona_SQL_COMPLETO_V1

begin;

create extension if not exists pgcrypto;

insert into public.app_modules (id, label, status, phase, audience, visible, sort_order)
values ('personalFinance', 'Mis gastos', 'active', 'Etapa 30', 'Finanzas personales privadas', true, 8)
on conflict (id) do update set
  label = excluded.label,
  status = excluded.status,
  phase = excluded.phase,
  audience = excluded.audience,
  visible = excluded.visible,
  sort_order = excluded.sort_order,
  updated_at = now();

create table if not exists public.personal_finance_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null default 'cash' check (account_type in ('cash','bank','wallet','card','other')),
  initial_balance numeric(12,2) not null default 0,
  currency text not null default 'PEN',
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_finance_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  movement_type text not null default 'expense' check (movement_type in ('income','expense','saving')),
  icon text default '💳',
  monthly_limit numeric(12,2) not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_finance_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.personal_finance_accounts(id) on delete set null,
  category_id uuid references public.personal_finance_categories(id) on delete set null,
  movement_type text not null check (movement_type in ('income','expense','saving')),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'PEN',
  movement_date date not null default current_date,
  description text not null,
  note text,
  receipt_ref text,
  source_module text default 'personalFinance',
  status text not null default 'confirmed' check (status in ('draft','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_finance_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_finance_recurring (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.personal_finance_accounts(id) on delete set null,
  category_id uuid references public.personal_finance_categories(id) on delete set null,
  name text not null,
  movement_type text not null check (movement_type in ('income','expense','saving')),
  amount numeric(12,2) not null check (amount > 0),
  day_of_month integer not null default 1 check (day_of_month between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_finance_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null default 'budget',
  title text not null,
  body text,
  severity text not null default 'info' check (severity in ('info','warning','danger')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_pf_accounts_owner on public.personal_finance_accounts(owner_id);
create index if not exists idx_pf_categories_owner on public.personal_finance_categories(owner_id);
create index if not exists idx_pf_transactions_owner_date on public.personal_finance_transactions(owner_id, movement_date desc);
create index if not exists idx_pf_transactions_category on public.personal_finance_transactions(category_id);
create index if not exists idx_pf_goals_owner on public.personal_finance_goals(owner_id);
create index if not exists idx_pf_alerts_owner on public.personal_finance_alerts(owner_id, created_at desc);

alter table public.personal_finance_accounts enable row level security;
alter table public.personal_finance_categories enable row level security;
alter table public.personal_finance_transactions enable row level security;
alter table public.personal_finance_goals enable row level security;
alter table public.personal_finance_recurring enable row level security;
alter table public.personal_finance_alerts enable row level security;

drop policy if exists "PF accounts own read" on public.personal_finance_accounts;
create policy "PF accounts own read" on public.personal_finance_accounts for select to authenticated using (owner_id = auth.uid());
drop policy if exists "PF accounts own insert" on public.personal_finance_accounts;
create policy "PF accounts own insert" on public.personal_finance_accounts for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "PF accounts own update" on public.personal_finance_accounts;
create policy "PF accounts own update" on public.personal_finance_accounts for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "PF accounts own delete" on public.personal_finance_accounts;
create policy "PF accounts own delete" on public.personal_finance_accounts for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "PF categories read" on public.personal_finance_categories;
create policy "PF categories read" on public.personal_finance_categories for select to authenticated using (owner_id = auth.uid() or owner_id is null);
drop policy if exists "PF categories insert" on public.personal_finance_categories;
create policy "PF categories insert" on public.personal_finance_categories for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "PF categories update" on public.personal_finance_categories;
create policy "PF categories update" on public.personal_finance_categories for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "PF categories delete" on public.personal_finance_categories;
create policy "PF categories delete" on public.personal_finance_categories for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "PF transactions own read" on public.personal_finance_transactions;
create policy "PF transactions own read" on public.personal_finance_transactions for select to authenticated using (owner_id = auth.uid());
drop policy if exists "PF transactions own insert" on public.personal_finance_transactions;
create policy "PF transactions own insert" on public.personal_finance_transactions for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "PF transactions own update" on public.personal_finance_transactions;
create policy "PF transactions own update" on public.personal_finance_transactions for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "PF transactions own delete" on public.personal_finance_transactions;
create policy "PF transactions own delete" on public.personal_finance_transactions for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "PF goals own read" on public.personal_finance_goals;
create policy "PF goals own read" on public.personal_finance_goals for select to authenticated using (owner_id = auth.uid());
drop policy if exists "PF goals own insert" on public.personal_finance_goals;
create policy "PF goals own insert" on public.personal_finance_goals for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "PF goals own update" on public.personal_finance_goals;
create policy "PF goals own update" on public.personal_finance_goals for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "PF goals own delete" on public.personal_finance_goals;
create policy "PF goals own delete" on public.personal_finance_goals for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "PF recurring own read" on public.personal_finance_recurring;
create policy "PF recurring own read" on public.personal_finance_recurring for select to authenticated using (owner_id = auth.uid());
drop policy if exists "PF recurring own insert" on public.personal_finance_recurring;
create policy "PF recurring own insert" on public.personal_finance_recurring for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "PF recurring own update" on public.personal_finance_recurring;
create policy "PF recurring own update" on public.personal_finance_recurring for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "PF recurring own delete" on public.personal_finance_recurring;
create policy "PF recurring own delete" on public.personal_finance_recurring for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "PF alerts own read" on public.personal_finance_alerts;
create policy "PF alerts own read" on public.personal_finance_alerts for select to authenticated using (owner_id = auth.uid());
drop policy if exists "PF alerts own update" on public.personal_finance_alerts;
create policy "PF alerts own update" on public.personal_finance_alerts for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "PF alerts own delete" on public.personal_finance_alerts;
create policy "PF alerts own delete" on public.personal_finance_alerts for delete to authenticated using (owner_id = auth.uid());

insert into public.personal_finance_categories (owner_id, name, movement_type, icon, monthly_limit, is_default)
values
(null, 'Alimentación', 'expense', '🍽️', 0, true),
(null, 'Transporte', 'expense', '🚌', 0, true),
(null, 'Colegio e hijos', 'expense', '🎒', 0, true),
(null, 'Hogar y servicios', 'expense', '🏠', 0, true),
(null, 'Salud', 'expense', '🩺', 0, true),
(null, 'Diversión', 'expense', '🎮', 0, true),
(null, 'Ahorro', 'saving', '🐷', 0, true),
(null, 'Ingreso principal', 'income', '💼', 0, true),
(null, 'Ingreso extra', 'income', '💵', 0, true)
on conflict do nothing;

commit;
