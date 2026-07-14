-- MiZona 30.74: núcleo Ride y Delivery (no habilita el servicio público)
create table if not exists public.mz_ride_drivers (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  local_user_id text,
  service_types text[] not null default array['ride']::text[],
  vehicle_type text not null default 'moto',
  vehicle_brand text default '', vehicle_model text default '', vehicle_color text default '',
  plate text default '', license_number text default '',
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  documents_ok boolean not null default false,
  online boolean not null default false,
  rating numeric(3,2) not null default 5,
  trips_completed integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.mz_ride_requests (
  id text primary key,
  code text unique not null,
  passenger_user_id uuid references auth.users(id) on delete set null,
  local_passenger_id text,
  driver_id text references public.mz_ride_drivers(id) on delete set null,
  service_type text not null default 'auto',
  origin_label text not null, destination_label text not null,
  origin_lat numeric, origin_lng numeric, destination_lat numeric, destination_lng numeric,
  distance_km numeric not null default 0, duration_min integer not null default 0,
  fare numeric(12,2) not null default 0, payment_method text not null default 'cash',
  status text not null default 'searching' check (status in ('searching','assigned','arriving','waiting','in_progress','completed','cancelled')),
  security_code text, cancellation_reason text, rating integer, rating_comment text default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), accepted_at timestamptz, started_at timestamptz,
  completed_at timestamptz, cancelled_at timestamptz, updated_at timestamptz not null default now()
);

create table if not exists public.mz_delivery_requests (
  id text primary key,
  code text unique not null,
  customer_user_id uuid references auth.users(id) on delete set null,
  local_customer_id text,
  driver_id text references public.mz_ride_drivers(id) on delete set null,
  business_id text references public.mz_businesses(id) on delete set null,
  order_id text references public.mz_orders(id) on delete set null,
  pickup_label text not null, dropoff_label text not null,
  pickup_lat numeric, pickup_lng numeric, dropoff_lat numeric, dropoff_lng numeric,
  package_type text not null default 'package', content text default '',
  recipient_name text default '', recipient_phone text default '',
  distance_km numeric not null default 0, fare numeric(12,2) not null default 0,
  payment_method text not null default 'cash',
  status text not null default 'searching' check (status in ('searching','assigned','picked_up','in_transit','delivered','cancelled')),
  proof_note text default '', proof_url text, cancellation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), accepted_at timestamptz, picked_up_at timestamptz,
  delivered_at timestamptz, cancelled_at timestamptz, updated_at timestamptz not null default now()
);

create table if not exists public.mz_ride_locations (
  id bigint generated always as identity primary key,
  driver_id text not null references public.mz_ride_drivers(id) on delete cascade,
  ride_id text references public.mz_ride_requests(id) on delete cascade,
  delivery_id text references public.mz_delivery_requests(id) on delete cascade,
  latitude numeric not null, longitude numeric not null, accuracy_m numeric,
  heading numeric, speed_mps numeric, recorded_at timestamptz not null default now(),
  check ((ride_id is not null) <> (delivery_id is not null))
);

create table if not exists public.mz_ride_reports (
  id text primary key,
  reporter_user_id uuid references auth.users(id) on delete set null,
  ride_id text references public.mz_ride_requests(id) on delete set null,
  delivery_id text references public.mz_delivery_requests(id) on delete set null,
  reason text not null, details text default '', emergency boolean not null default false,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists mz_ride_requests_passenger_idx on public.mz_ride_requests(passenger_user_id, created_at desc);
create index if not exists mz_ride_requests_driver_idx on public.mz_ride_requests(driver_id, created_at desc);
create index if not exists mz_delivery_requests_customer_idx on public.mz_delivery_requests(customer_user_id, created_at desc);
create index if not exists mz_delivery_requests_driver_idx on public.mz_delivery_requests(driver_id, created_at desc);
create index if not exists mz_ride_locations_service_idx on public.mz_ride_locations(ride_id, delivery_id, recorded_at desc);

alter table public.mz_ride_drivers enable row level security;
alter table public.mz_ride_requests enable row level security;
alter table public.mz_delivery_requests enable row level security;
alter table public.mz_ride_locations enable row level security;
alter table public.mz_ride_reports enable row level security;

create policy "ride drivers read authenticated" on public.mz_ride_drivers for select to authenticated using (true);
create policy "ride driver manages own profile" on public.mz_ride_drivers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ride passenger reads own" on public.mz_ride_requests for select to authenticated using (passenger_user_id = auth.uid() or driver_id in (select id from public.mz_ride_drivers where user_id=auth.uid()));
create policy "ride passenger creates own" on public.mz_ride_requests for insert to authenticated with check (passenger_user_id = auth.uid());
create policy "ride participants update" on public.mz_ride_requests for update to authenticated using (passenger_user_id = auth.uid() or driver_id in (select id from public.mz_ride_drivers where user_id=auth.uid()));
create policy "delivery participants read" on public.mz_delivery_requests for select to authenticated using (customer_user_id = auth.uid() or driver_id in (select id from public.mz_ride_drivers where user_id=auth.uid()));
create policy "delivery customer creates" on public.mz_delivery_requests for insert to authenticated with check (customer_user_id = auth.uid());
create policy "delivery participants update" on public.mz_delivery_requests for update to authenticated using (customer_user_id = auth.uid() or driver_id in (select id from public.mz_ride_drivers where user_id=auth.uid()));
create policy "ride participants read locations" on public.mz_ride_locations for select to authenticated using (
  driver_id in (select id from public.mz_ride_drivers where user_id=auth.uid()) or
  ride_id in (select id from public.mz_ride_requests where passenger_user_id=auth.uid()) or
  delivery_id in (select id from public.mz_delivery_requests where customer_user_id=auth.uid())
);
create policy "driver writes locations" on public.mz_ride_locations for insert to authenticated with check (driver_id in (select id from public.mz_ride_drivers where user_id=auth.uid()));
create policy "reporter manages reports" on public.mz_ride_reports for all to authenticated using (reporter_user_id=auth.uid()) with check (reporter_user_id=auth.uid());

alter publication supabase_realtime add table public.mz_ride_requests;
alter publication supabase_realtime add table public.mz_delivery_requests;
alter publication supabase_realtime add table public.mz_ride_locations;
