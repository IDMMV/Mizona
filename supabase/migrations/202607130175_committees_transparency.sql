create table if not exists public.mz_committees (
 id uuid primary key default gen_random_uuid(), zone_id text not null, name text not null,
 description text, status text not null default 'active', created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.mz_committee_members (
 id uuid primary key default gen_random_uuid(), committee_id uuid not null references public.mz_committees(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'member', active boolean not null default true,
 joined_at timestamptz not null default now(), unique(committee_id,user_id)
);
create table if not exists public.mz_committee_movements (
 id uuid primary key default gen_random_uuid(), committee_id uuid not null references public.mz_committees(id) on delete cascade,
 movement_type text not null check (movement_type in ('income','expense')), category text not null, concept text not null,
 detail text, amount numeric(14,2) not null check(amount>=0), movement_date date not null default current_date,
 evidence jsonb not null default '[]'::jsonb, status text not null default 'registered', created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.mz_committee_events (
 id uuid primary key default gen_random_uuid(), committee_id uuid not null references public.mz_committees(id) on delete cascade,
 title text not null, description text, starts_at timestamptz not null, ends_at timestamptz,
 location text, publish_home boolean not null default false, status text not null default 'scheduled', created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.mz_committees enable row level security;
alter table public.mz_committee_members enable row level security;
alter table public.mz_committee_movements enable row level security;
alter table public.mz_committee_events enable row level security;
create or replace function public.mz_is_committee_member(cid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.mz_committee_members m where m.committee_id=cid and m.user_id=auth.uid() and m.active);
$$;
create policy "committee read members" on public.mz_committees for select using (created_by=auth.uid() or public.mz_is_committee_member(id));
create policy "committee create" on public.mz_committees for insert with check (created_by=auth.uid());
create policy "committee owner update" on public.mz_committees for update using (created_by=auth.uid());
create policy "committee members read" on public.mz_committee_members for select using (user_id=auth.uid() or public.mz_is_committee_member(committee_id));
create policy "committee finance read" on public.mz_committee_movements for select using (public.mz_is_committee_member(committee_id));
create policy "committee finance write" on public.mz_committee_movements for all using (public.mz_is_committee_member(committee_id)) with check (public.mz_is_committee_member(committee_id) and created_by=auth.uid());
create policy "committee events read" on public.mz_committee_events for select using (publish_home or public.mz_is_committee_member(committee_id));
create policy "committee events write" on public.mz_committee_events for all using (public.mz_is_committee_member(committee_id)) with check (public.mz_is_committee_member(committee_id) and created_by=auth.uid());
