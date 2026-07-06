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

-- Sprint 4: Negocios y lugares
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  description text,
  zone text not null,
  address text,
  latitude numeric,
  longitude numeric,
  phone text,
  opening_hours jsonb default '{}'::jsonb,
  source_type text not null default 'community' check (source_type in ('public','community','owner','admin')),
  affiliate_status text not null default 'unaffiliated' check (affiliate_status in ('unaffiliated','pending','affiliated','suspended')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  owner_profile_id uuid references profiles(id),
  rating numeric(2,1) default 0,
  review_count integer default 0,
  is_open boolean default false,
  status text not null default 'active' check (status in ('draft','pending','active','hidden','rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists places_zone_category_idx on places(zone, category);
create index if not exists places_affiliate_idx on places(affiliate_status, verification_status);

create table if not exists place_claims (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  claimant_profile_id uuid references profiles(id) on delete cascade,
  evidence_path text,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','more_info')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists place_suggestions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references profiles(id),
  name text not null,
  category text not null,
  zone text not null,
  address text,
  photo_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','duplicate')),
  created_at timestamptz default now()
);

create table if not exists place_favorites (
  place_id uuid references places(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(place_id, profile_id)
);

create table if not exists place_actions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  profile_id uuid references profiles(id),
  action_type text not null check (action_type in ('view','favorite','share','route','call','chat','claim','coupon','redeem')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table places enable row level security;
alter table place_claims enable row level security;
alter table place_suggestions enable row level security;
alter table place_favorites enable row level security;
alter table place_actions enable row level security;

drop policy if exists "Public read active places" on places;
create policy "Public read active places" on places for select using (status = 'active');

drop policy if exists "Owners manage claimed places" on places;
create policy "Owners manage claimed places" on places
for update using (auth.uid() = owner_profile_id) with check (auth.uid() = owner_profile_id);

drop policy if exists "Users create own claims" on place_claims;
create policy "Users create own claims" on place_claims
for insert with check (auth.uid() = claimant_profile_id);

drop policy if exists "Users read own claims" on place_claims;
create policy "Users read own claims" on place_claims
for select using (auth.uid() = claimant_profile_id);

drop policy if exists "Users create suggestions" on place_suggestions;
create policy "Users create suggestions" on place_suggestions
for insert with check (auth.uid() = submitted_by);

drop policy if exists "Users manage place favorites" on place_favorites;
create policy "Users manage place favorites" on place_favorites
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "Users create and read own place actions" on place_actions;
create policy "Users create and read own place actions" on place_actions
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Sprint 5: Marketplace local
create table if not exists marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid references profiles(id) on delete cascade,
  community_id uuid references communities(id) on delete set null,
  title text not null,
  description text,
  category text not null,
  condition text not null check (condition in ('new','used_excellent','used_good','used_regular','service')),
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'PEN',
  zone text not null,
  latitude numeric,
  longitude numeric,
  delivery_available boolean default false,
  negotiable boolean default false,
  status text not null default 'pending' check (status in ('draft','pending','active','reserved','sold','hidden','rejected')),
  moderation_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists marketplace_zone_category_idx on marketplace_listings(zone, category);
create index if not exists marketplace_status_created_idx on marketplace_listings(status, created_at desc);

create table if not exists marketplace_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references marketplace_listings(id) on delete cascade,
  storage_path text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists marketplace_favorites (
  listing_id uuid references marketplace_listings(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(listing_id, profile_id)
);

create table if not exists marketplace_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references marketplace_listings(id) on delete cascade,
  reporter_profile_id uuid references profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists marketplace_actions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references marketplace_listings(id) on delete cascade,
  profile_id uuid references profiles(id),
  action_type text not null check (action_type in ('view','favorite','share','chat','report','reserve','sold')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table marketplace_listings enable row level security;
alter table marketplace_images enable row level security;
alter table marketplace_favorites enable row level security;
alter table marketplace_reports enable row level security;
alter table marketplace_actions enable row level security;

drop policy if exists "Public read active marketplace" on marketplace_listings;
create policy "Public read active marketplace" on marketplace_listings
for select using (status = 'active');

drop policy if exists "Sellers manage own marketplace listings" on marketplace_listings;
create policy "Sellers manage own marketplace listings" on marketplace_listings
for all using (auth.uid() = seller_profile_id) with check (auth.uid() = seller_profile_id);

drop policy if exists "Public read marketplace images" on marketplace_images;
create policy "Public read marketplace images" on marketplace_images
for select using (exists(select 1 from marketplace_listings l where l.id = listing_id and l.status = 'active'));

drop policy if exists "Users manage marketplace favorites" on marketplace_favorites;
create policy "Users manage marketplace favorites" on marketplace_favorites
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "Users create marketplace reports" on marketplace_reports;
create policy "Users create marketplace reports" on marketplace_reports
for insert with check (auth.uid() = reporter_profile_id);

drop policy if exists "Users read own marketplace reports" on marketplace_reports;
create policy "Users read own marketplace reports" on marketplace_reports
for select using (auth.uid() = reporter_profile_id);

drop policy if exists "Users manage own marketplace actions" on marketplace_actions;
create policy "Users manage own marketplace actions" on marketplace_actions
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Sprint 6: CampusHugo
create table if not exists campus_courses (
  id uuid primary key default gen_random_uuid(),
  instructor_profile_id uuid references profiles(id) on delete set null,
  title text not null,
  slug text unique not null,
  summary text,
  category text not null,
  level text not null,
  cover_path text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'PEN',
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  status text not null default 'draft' check (status in ('draft','pending','published','paused','rejected','archived')),
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists campus_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references campus_courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists campus_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references campus_modules(id) on delete cascade,
  title text not null,
  lesson_type text not null default 'video' check (lesson_type in ('video','text','file','quiz','live')),
  content_url text,
  content_text text,
  duration_minutes integer not null default 0,
  is_preview boolean default false,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists campus_enrollments (
  course_id uuid references campus_courses(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  primary key(course_id, profile_id)
);

create table if not exists campus_lesson_progress (
  lesson_id uuid references campus_lessons(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  completed boolean default false,
  last_position_seconds integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  primary key(lesson_id, profile_id)
);

create table if not exists campus_assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references campus_courses(id) on delete cascade,
  title text not null,
  passing_score numeric(5,2) not null default 70,
  status text not null default 'draft' check (status in ('draft','published','paused')),
  created_at timestamptz default now()
);

create table if not exists campus_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references campus_assessments(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  score numeric(5,2),
  passed boolean default false,
  answers jsonb default '{}'::jsonb,
  submitted_at timestamptz default now()
);

create table if not exists campus_certificates (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references campus_courses(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  certificate_code text unique not null,
  storage_path text,
  issued_at timestamptz default now(),
  revoked_at timestamptz,
  unique(course_id, profile_id)
);

create index if not exists campus_courses_category_status_idx on campus_courses(category, status);
create index if not exists campus_modules_course_sort_idx on campus_modules(course_id, sort_order);
create index if not exists campus_lessons_module_sort_idx on campus_lessons(module_id, sort_order);
create index if not exists campus_enrollments_profile_idx on campus_enrollments(profile_id, status);

alter table campus_courses enable row level security;
alter table campus_modules enable row level security;
alter table campus_lessons enable row level security;
alter table campus_enrollments enable row level security;
alter table campus_lesson_progress enable row level security;
alter table campus_assessments enable row level security;
alter table campus_attempts enable row level security;
alter table campus_certificates enable row level security;

drop policy if exists "Public read published campus courses" on campus_courses;
create policy "Public read published campus courses" on campus_courses
for select using (status = 'published');

drop policy if exists "Public read modules of published courses" on campus_modules;
create policy "Public read modules of published courses" on campus_modules
for select using (exists (
  select 1 from campus_courses c where c.id = campus_modules.course_id and c.status = 'published'
));

drop policy if exists "Public read preview lessons" on campus_lessons;
create policy "Public read preview lessons" on campus_lessons
for select using (
  is_preview = true or exists (
    select 1 from campus_modules m
    join campus_enrollments e on e.course_id = m.course_id
    where m.id = campus_lessons.module_id and e.profile_id = auth.uid() and e.status in ('active','completed')
  )
);

drop policy if exists "Users manage own campus enrollments" on campus_enrollments;
create policy "Users manage own campus enrollments" on campus_enrollments
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "Users manage own lesson progress" on campus_lesson_progress;
create policy "Users manage own lesson progress" on campus_lesson_progress
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "Users read published assessments" on campus_assessments;
create policy "Users read published assessments" on campus_assessments
for select using (status = 'published');

drop policy if exists "Users manage own assessment attempts" on campus_attempts;
create policy "Users manage own assessment attempts" on campus_attempts
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "Users read own certificates" on campus_certificates;
create policy "Users read own certificates" on campus_certificates
for select using (auth.uid() = profile_id);

-- Sprint 7: MiZona Business multiempresa
create table if not exists business_tenants (
  id uuid primary key default gen_random_uuid(), owner_profile_id uuid references profiles(id) on delete cascade,
  name text not null, legal_name text, tax_id text, category text, plan text not null default 'starter',
  status text not null default 'active' check (status in ('pending','active','suspended','closed')), created_at timestamptz default now()
);
create table if not exists business_branches (
  id uuid primary key default gen_random_uuid(), business_id uuid references business_tenants(id) on delete cascade,
  name text not null, zone text, address text, active boolean default true, created_at timestamptz default now()
);
create table if not exists business_members (
  business_id uuid references business_tenants(id) on delete cascade, profile_id uuid references profiles(id) on delete cascade,
  member_role text not null default 'cashier' check (member_role in ('owner','admin','cashier','kitchen','warehouse','viewer')),
  branch_id uuid references business_branches(id) on delete set null, created_at timestamptz default now(), primary key (business_id, profile_id)
);
create table if not exists business_products (
  id uuid primary key default gen_random_uuid(), business_id uuid references business_tenants(id) on delete cascade,
  name text not null, category text, sale_price numeric(12,2) not null default 0, cost_price numeric(12,2) not null default 0,
  stock numeric(12,3) not null default 0, minimum_stock numeric(12,3) not null default 0, active boolean default true, created_at timestamptz default now()
);
create table if not exists business_orders (
  id uuid primary key default gen_random_uuid(), business_id uuid references business_tenants(id) on delete cascade,
  branch_id uuid references business_branches(id) on delete cascade, created_by uuid references profiles(id),
  order_number bigint generated by default as identity, service_type text not null default 'counter' check (service_type in ('counter','table','delivery','pickup')),
  status text not null default 'pending' check (status in ('pending','preparing','ready','delivered','cancelled')),
  subtotal numeric(12,2) not null default 0, tax_amount numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  payment_method text check (payment_method in ('cash','card','wallet','mixed')), cash_received numeric(12,2) default 0,
  change_amount numeric(12,2) default 0, paid_at timestamptz, created_at timestamptz default now()
);
create table if not exists business_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid references business_orders(id) on delete cascade,
  product_id uuid references business_products(id), quantity numeric(12,3) not null default 1, unit_price numeric(12,2) not null, total numeric(12,2) not null
);
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(), business_id uuid references business_tenants(id) on delete cascade,
  branch_id uuid references business_branches(id), product_id uuid references business_products(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase','sale','adjustment','waste','transfer_in','transfer_out')),
  quantity numeric(12,3) not null, reference_id uuid, created_by uuid references profiles(id), created_at timestamptz default now()
);
create table if not exists business_customers (
  id uuid primary key default gen_random_uuid(), business_id uuid references business_tenants(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null, display_name text not null, phone text, points integer default 0,
  total_spent numeric(12,2) default 0, created_at timestamptz default now()
);
alter table business_tenants enable row level security;
alter table business_branches enable row level security;
alter table business_members enable row level security;
alter table business_products enable row level security;
alter table business_orders enable row level security;
alter table business_order_items enable row level security;
alter table inventory_movements enable row level security;
alter table business_customers enable row level security;
create or replace function is_business_member(target_business uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from business_members bm where bm.business_id = target_business and bm.profile_id = auth.uid());
$$;
drop policy if exists "Members read business tenants" on business_tenants;
create policy "Members read business tenants" on business_tenants for select using (owner_profile_id = auth.uid() or is_business_member(id));
drop policy if exists "Owners manage business tenants" on business_tenants;
create policy "Owners manage business tenants" on business_tenants for all using (owner_profile_id = auth.uid()) with check (owner_profile_id = auth.uid());
drop policy if exists "Members manage business products" on business_products;
create policy "Members manage business products" on business_products for all using (is_business_member(business_id)) with check (is_business_member(business_id));
drop policy if exists "Members manage business orders" on business_orders;
create policy "Members manage business orders" on business_orders for all using (is_business_member(business_id)) with check (is_business_member(business_id));
drop policy if exists "Members read branches" on business_branches;
create policy "Members read branches" on business_branches for select using (is_business_member(business_id));
drop policy if exists "Members manage inventory" on inventory_movements;
create policy "Members manage inventory" on inventory_movements for all using (is_business_member(business_id)) with check (is_business_member(business_id));
drop policy if exists "Members manage customers" on business_customers;
create policy "Members manage customers" on business_customers for all using (is_business_member(business_id)) with check (is_business_member(business_id));

-- Sprint 8: MiZona Ride
create table if not exists ride_drivers (
  profile_id uuid primary key references profiles(id) on delete cascade,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  rating numeric(2,1) default 5, total_trips integer default 0, available boolean default false,
  zone text, created_at timestamptz default now()
);
create table if not exists ride_vehicles (
  id uuid primary key default gen_random_uuid(), driver_id uuid references ride_drivers(profile_id) on delete cascade,
  vehicle_type text not null check (vehicle_type in ('motorcycle','car','van','truck')),
  brand text, model text, plate text unique not null, color text, verification_status text default 'pending', active boolean default true
);
create table if not exists ride_requests (
  id uuid primary key default gen_random_uuid(), passenger_id uuid references profiles(id) on delete cascade,
  driver_id uuid references ride_drivers(profile_id), vehicle_id uuid references ride_vehicles(id),
  service_type text not null check (service_type in ('ride','delivery','courier')),
  origin_text text not null, destination_text text not null, origin_lat numeric, origin_lng numeric, destination_lat numeric, destination_lng numeric,
  estimated_price numeric(12,2), final_price numeric(12,2), payment_method text,
  security_code text, status text not null default 'searching' check (status in ('searching','accepted','driver_arriving','in_progress','completed','cancelled')),
  created_at timestamptz default now(), accepted_at timestamptz, completed_at timestamptz
);
create table if not exists ride_events (
  id uuid primary key default gen_random_uuid(), ride_id uuid references ride_requests(id) on delete cascade,
  actor_profile_id uuid references profiles(id), event_type text not null, metadata jsonb default '{}'::jsonb, created_at timestamptz default now()
);
create table if not exists ride_reports (
  id uuid primary key default gen_random_uuid(), ride_id uuid references ride_requests(id) on delete cascade,
  reporter_id uuid references profiles(id), reported_profile_id uuid references profiles(id), reason text not null,
  details text, status text default 'open', created_at timestamptz default now()
);
alter table ride_drivers enable row level security;
alter table ride_vehicles enable row level security;
alter table ride_requests enable row level security;
alter table ride_events enable row level security;
alter table ride_reports enable row level security;
drop policy if exists "Public read available verified drivers" on ride_drivers;
create policy "Public read available verified drivers" on ride_drivers for select using (verification_status='verified' and available=true);
drop policy if exists "Drivers manage own profile" on ride_drivers;
create policy "Drivers manage own profile" on ride_drivers for all using (auth.uid()=profile_id) with check (auth.uid()=profile_id);
drop policy if exists "Drivers manage own vehicles" on ride_vehicles;
create policy "Drivers manage own vehicles" on ride_vehicles for all using (auth.uid()=driver_id) with check (auth.uid()=driver_id);
drop policy if exists "Participants read ride" on ride_requests;
create policy "Participants read ride" on ride_requests for select using (auth.uid()=passenger_id or auth.uid()=driver_id);
drop policy if exists "Passengers create rides" on ride_requests;
create policy "Passengers create rides" on ride_requests for insert with check (auth.uid()=passenger_id);
drop policy if exists "Participants update ride" on ride_requests;
create policy "Participants update ride" on ride_requests for update using (auth.uid()=passenger_id or auth.uid()=driver_id);
drop policy if exists "Participants read events" on ride_events;
create policy "Participants read events" on ride_events for select using (exists(select 1 from ride_requests r where r.id=ride_id and (r.passenger_id=auth.uid() or r.driver_id=auth.uid())));
drop policy if exists "Users create ride reports" on ride_reports;
create policy "Users create ride reports" on ride_reports for insert with check (auth.uid()=reporter_id);

-- Sprint 9: IA MiZona
create table if not exists assistant_threads (
  id uuid primary key default gen_random_uuid(), profile_id uuid references profiles(id) on delete cascade,
  title text not null default 'Nueva conversación', assistant_type text not null default 'general',
  private_mode boolean default false, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists assistant_messages (
  id uuid primary key default gen_random_uuid(), thread_id uuid references assistant_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')), content text not null,
  provider text, token_count integer default 0, safety_flags jsonb default '[]'::jsonb, created_at timestamptz default now()
);
create table if not exists assistant_feedback (
  id uuid primary key default gen_random_uuid(), message_id uuid references assistant_messages(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade, rating smallint check (rating in (-1,1)), reason text, created_at timestamptz default now(),
  unique(message_id, profile_id)
);
alter table assistant_threads enable row level security;
alter table assistant_messages enable row level security;
alter table assistant_feedback enable row level security;
drop policy if exists "Users manage assistant threads" on assistant_threads;
create policy "Users manage assistant threads" on assistant_threads for all using (auth.uid()=profile_id) with check (auth.uid()=profile_id);
drop policy if exists "Users read thread messages" on assistant_messages;
create policy "Users read thread messages" on assistant_messages for select using (exists(select 1 from assistant_threads t where t.id=thread_id and t.profile_id=auth.uid()));
drop policy if exists "Users create thread messages" on assistant_messages;
create policy "Users create thread messages" on assistant_messages for insert with check (exists(select 1 from assistant_threads t where t.id=thread_id and t.profile_id=auth.uid()));
drop policy if exists "Users manage assistant feedback" on assistant_feedback;
create policy "Users manage assistant feedback" on assistant_feedback for all using (auth.uid()=profile_id) with check (auth.uid()=profile_id);

-- Etapa final: identidad, términos, preferencias, auditoría y módulos
create or replace function username_is_allowed(value text)
returns boolean language sql immutable as $$
  select value ~ '^[A-Za-z0-9_]{4,20}$'
    and lower(value) not in ('admin','administrator','soporte','support','mizona','root','sistema','system');
$$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_username_format_check') then
    alter table profiles add constraint profiles_username_format_check check (username_is_allowed(username));
  end if;
end $$;

create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id, username, display_name, role)
  values (
    new.id,
    upper(coalesce(nullif(new.raw_user_meta_data->>'username',''), 'USER_' || substr(new.id::text,1,8))),
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(coalesce(new.email,'Usuario'),'@',1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure handle_new_auth_user();

create table if not exists terms_acceptances (
  id uuid primary key default gen_random_uuid(), profile_id uuid references profiles(id) on delete cascade,
  terms_version text not null, privacy_version text not null, declaration jsonb default '{}'::jsonb,
  accepted_at timestamptz default now(), ip_hash text, user_agent text
);
create table if not exists notification_preferences (
  profile_id uuid primary key references profiles(id) on delete cascade,
  community boolean default true, chat boolean default true, offers boolean default true,
  courses boolean default false, ride boolean default true, push_enabled boolean default false, updated_at timestamptz default now()
);
create table if not exists app_modules (
  id text primary key, label text not null, status text not null default 'active' check (status in ('active','beta','maintenance','soon')),
  audience text, sort_order integer default 0, updated_by uuid references profiles(id), updated_at timestamptz default now()
);
create table if not exists audit_logs (
  id bigint generated always as identity primary key, actor_profile_id uuid references profiles(id) on delete set null,
  action text not null, entity_type text, entity_id text, metadata jsonb default '{}'::jsonb, created_at timestamptz default now()
);
alter table profiles enable row level security;
alter table terms_acceptances enable row level security;
alter table notification_preferences enable row level security;
alter table app_modules enable row level security;
alter table audit_logs enable row level security;
drop policy if exists "Authenticated read basic profiles" on profiles;
create policy "Authenticated read basic profiles" on profiles for select to authenticated using (true);
drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles for update using (auth.uid()=id) with check (auth.uid()=id);
drop policy if exists "Users manage own terms" on terms_acceptances;
create policy "Users manage own terms" on terms_acceptances for all using (auth.uid()=profile_id) with check (auth.uid()=profile_id);
drop policy if exists "Users manage notification preferences" on notification_preferences;
create policy "Users manage notification preferences" on notification_preferences for all using (auth.uid()=profile_id) with check (auth.uid()=profile_id);
drop policy if exists "Public read module states" on app_modules;
create policy "Public read module states" on app_modules for select using (true);
drop policy if exists "Admins manage module states" on app_modules;
create policy "Admins manage module states" on app_modules for all using (exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "Admins read audit logs" on audit_logs;
create policy "Admins read audit logs" on audit_logs for select using (exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin'));
