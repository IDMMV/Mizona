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
