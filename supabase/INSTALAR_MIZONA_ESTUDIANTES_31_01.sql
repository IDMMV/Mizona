-- MiZona Estudiantes 31.01 · instalación limpia y repetible
-- Conserva auth.users. Elimina solamente objetos mz_* creados por intentos anteriores.

begin;

-- Evitar error si la tabla todavía no pertenece a Realtime.
do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mz_notifications'
  ) then
    execute 'alter publication supabase_realtime drop table public.mz_notifications';
  end if;
exception when others then
  null;
end $$;

drop trigger if exists on_auth_user_created_mz on auth.users;
drop function if exists public.mz_create_profile_for_new_user() cascade;
drop function if exists public.mz_is_admin() cascade;
drop function if exists public.mz_touch_updated_at() cascade;

drop table if exists public.mz_reports cascade;
drop table if exists public.mz_push_subscriptions cascade;
drop table if exists public.mz_notification_preferences cascade;
drop table if exists public.mz_notifications cascade;
drop table if exists public.mz_help_responses cascade;
drop table if exists public.mz_help_requests cascade;
drop table if exists public.mz_reactions cascade;
drop table if exists public.mz_comments cascade;
drop table if exists public.mz_posts cascade;
drop table if exists public.mz_community_members cascade;
drop table if exists public.mz_communities cascade;
drop table if exists public.mz_institution_members cascade;
drop table if exists public.mz_institutions cascade;
drop table if exists public.mz_user_profiles cascade;

drop type if exists public.mz_institution_type cascade;
drop type if exists public.mz_verification_status cascade;
drop type if exists public.mz_education_level cascade;

commit;

-- MiZona Estudiantes 31.00
create extension if not exists pgcrypto;

create type public.mz_education_level as enum ('secondary','technical','university','graduate');
create type public.mz_verification_status as enum ('pending','verified','rejected','suspended');
create type public.mz_institution_type as enum ('school','technical_institute','university','academy','other');

create table if not exists public.mz_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  city text,
  education_level public.mz_education_level not null default 'university',
  verification_status public.mz_verification_status not null default 'pending',
  role text not null default 'student' check (role in ('student','moderator','institution_admin','admin','super_admin')),
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  institution_type public.mz_institution_type not null,
  description text,
  logo_url text,
  website_url text,
  country text not null default 'Perú',
  city text,
  verification_status public.mz_verification_status not null default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_institution_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.mz_institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'student' check (member_role in ('student','graduate','teacher','staff','institution_admin')),
  academic_program text,
  grade_cycle text,
  student_code text,
  verification_status public.mz_verification_status not null default 'pending',
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(institution_id,user_id)
);

create table if not exists public.mz_communities (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.mz_institutions(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  community_type text not null default 'interest' check (community_type in ('institution','career','study_group','club','project','interest')),
  visibility text not null default 'public' check (visibility in ('public','institution','private')),
  status text not null default 'active' check (status in ('active','archived','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_community_members (
  community_id uuid not null references public.mz_communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','moderator','owner')),
  status text not null default 'active' check (status in ('pending','active','blocked')),
  joined_at timestamptz not null default now(),
  primary key(community_id,user_id)
);

create table if not exists public.mz_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid references public.mz_communities(id) on delete cascade,
  body text not null,
  post_type text not null default 'post' check (post_type in ('post','question','experience','project','opportunity')),
  visibility text not null default 'public' check (visibility in ('public','institution','community','private')),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.mz_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create table if not exists public.mz_reactions (
  post_id uuid not null references public.mz_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  primary key(post_id,user_id,reaction)
);

create table if not exists public.mz_help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.mz_user_profiles(user_id) on delete cascade,
  title text not null,
  description text not null,
  topic text not null,
  level public.mz_education_level not null,
  status text not null default 'open' check (status in ('open','matched','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_help_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mz_help_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'offered' check (status in ('offered','accepted','rejected','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.mz_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mz_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app boolean not null default true,
  push_enabled boolean not null default false,
  email_enabled boolean not null default true,
  help_updates boolean not null default true,
  community_updates boolean not null default true,
  institution_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mz_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mz_profiles_search_idx on public.mz_user_profiles using gin (to_tsvector('simple', coalesce(display_name,'') || ' ' || coalesce(username,'') || ' ' || coalesce(bio,'')));
create index if not exists mz_help_open_idx on public.mz_help_requests(status,created_at desc);
create index if not exists mz_notifications_user_idx on public.mz_notifications(user_id,created_at desc);
create index if not exists mz_posts_community_idx on public.mz_posts(community_id,created_at desc);

create or replace function public.mz_touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists mz_profiles_touch on public.mz_user_profiles;
create trigger mz_profiles_touch before update on public.mz_user_profiles for each row execute function public.mz_touch_updated_at();
drop trigger if exists mz_institutions_touch on public.mz_institutions;
create trigger mz_institutions_touch before update on public.mz_institutions for each row execute function public.mz_touch_updated_at();
drop trigger if exists mz_communities_touch on public.mz_communities;
create trigger mz_communities_touch before update on public.mz_communities for each row execute function public.mz_touch_updated_at();
drop trigger if exists mz_posts_touch on public.mz_posts;
create trigger mz_posts_touch before update on public.mz_posts for each row execute function public.mz_touch_updated_at();
drop trigger if exists mz_help_touch on public.mz_help_requests;
create trigger mz_help_touch before update on public.mz_help_requests for each row execute function public.mz_touch_updated_at();

create or replace function public.mz_create_profile_for_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.mz_user_profiles(user_id,username,display_name,education_level)
  values(new.id, coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1)), coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)), coalesce((new.raw_user_meta_data->>'education_level')::public.mz_education_level,'university'))
  on conflict(user_id) do nothing;
  insert into public.mz_notification_preferences(user_id) values(new.id) on conflict(user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created_mz on auth.users;
create trigger on_auth_user_created_mz after insert on auth.users for each row execute function public.mz_create_profile_for_new_user();

-- Crear perfiles para usuarios de Auth que existían antes de esta migración.
insert into public.mz_user_profiles(user_id, username, display_name, education_level)
select
  u.id,
  left(coalesce(nullif(regexp_replace(lower(coalesce(u.raw_user_meta_data->>'username', split_part(u.email,'@',1))), '[^a-z0-9_]+', '_', 'g'), ''), 'usuario_' || left(u.id::text, 8)), 40),
  coalesce(nullif(u.raw_user_meta_data->>'display_name',''), split_part(u.email,'@',1), 'Estudiante'),
  case when u.raw_user_meta_data->>'education_level' in ('secondary','technical','university','graduate')
       then (u.raw_user_meta_data->>'education_level')::public.mz_education_level
       else 'university'::public.mz_education_level end
from auth.users u
on conflict (user_id) do nothing;

insert into public.mz_notification_preferences(user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Administrador inicial solicitado para esta instalación.
update public.mz_user_profiles p
set role='super_admin', verification_status='verified', status='active', updated_at=now()
from auth.users u
where p.user_id=u.id and lower(u.email)=lower('josehugo.tec@gmail.com');

create or replace function public.mz_is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.mz_user_profiles where user_id=auth.uid() and role in ('admin','super_admin','moderator')) $$;

alter table public.mz_user_profiles enable row level security;
alter table public.mz_institutions enable row level security;
alter table public.mz_institution_members enable row level security;
alter table public.mz_communities enable row level security;
alter table public.mz_community_members enable row level security;
alter table public.mz_posts enable row level security;
alter table public.mz_comments enable row level security;
alter table public.mz_reactions enable row level security;
alter table public.mz_help_requests enable row level security;
alter table public.mz_help_responses enable row level security;
alter table public.mz_notifications enable row level security;
alter table public.mz_notification_preferences enable row level security;
alter table public.mz_push_subscriptions enable row level security;
alter table public.mz_reports enable row level security;

create policy "profiles readable by authenticated" on public.mz_user_profiles for select to authenticated using(status='active');
create policy "users update own profile" on public.mz_user_profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users insert own profile" on public.mz_user_profiles for insert to authenticated with check(user_id=auth.uid());

create policy "verified institutions readable" on public.mz_institutions for select to authenticated using(verification_status='verified' or created_by=auth.uid() or public.mz_is_admin());
create policy "authenticated create institutions" on public.mz_institutions for insert to authenticated with check(created_by=auth.uid());
create policy "owners update institutions" on public.mz_institutions for update to authenticated using(created_by=auth.uid() or public.mz_is_admin());

create policy "members see own memberships" on public.mz_institution_members for select to authenticated using(user_id=auth.uid() or public.mz_is_admin());
create policy "users request membership" on public.mz_institution_members for insert to authenticated with check(user_id=auth.uid());
create policy "admins update memberships" on public.mz_institution_members for update to authenticated using(public.mz_is_admin());

create policy "communities readable" on public.mz_communities for select to authenticated using(status='active' and (visibility='public' or owner_id=auth.uid() or exists(select 1 from public.mz_community_members m where m.community_id=id and m.user_id=auth.uid() and m.status='active')));
create policy "users create communities" on public.mz_communities for insert to authenticated with check(owner_id=auth.uid());
create policy "owners manage communities" on public.mz_communities for update to authenticated using(owner_id=auth.uid() or public.mz_is_admin());
create policy "memberships readable" on public.mz_community_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.mz_communities c where c.id=community_id and c.owner_id=auth.uid()) or public.mz_is_admin());
create policy "users join communities" on public.mz_community_members for insert to authenticated with check(user_id=auth.uid());

create policy "posts readable" on public.mz_posts for select to authenticated using(status='published');
create policy "users create posts" on public.mz_posts for insert to authenticated with check(user_id=auth.uid());
create policy "authors manage posts" on public.mz_posts for update to authenticated using(user_id=auth.uid() or public.mz_is_admin());
create policy "comments readable" on public.mz_comments for select to authenticated using(status='published');
create policy "users create comments" on public.mz_comments for insert to authenticated with check(user_id=auth.uid());
create policy "authors delete comments" on public.mz_comments for delete to authenticated using(user_id=auth.uid() or public.mz_is_admin());
create policy "reactions readable" on public.mz_reactions for select to authenticated using(true);
create policy "users react" on public.mz_reactions for insert to authenticated with check(user_id=auth.uid());
create policy "users remove reactions" on public.mz_reactions for delete to authenticated using(user_id=auth.uid());

create policy "help requests readable" on public.mz_help_requests for select to authenticated using(status in ('open','matched','completed') or user_id=auth.uid());
create policy "users create help requests" on public.mz_help_requests for insert to authenticated with check(user_id=auth.uid());
create policy "owners update help requests" on public.mz_help_requests for update to authenticated using(user_id=auth.uid());
create policy "help responses visible to participants" on public.mz_help_responses for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.mz_help_requests r where r.id=request_id and r.user_id=auth.uid()));
create policy "users offer help" on public.mz_help_responses for insert to authenticated with check(user_id=auth.uid());

create policy "users see own notifications" on public.mz_notifications for select to authenticated using(user_id=auth.uid());
create policy "users update own notifications" on public.mz_notifications for update to authenticated using(user_id=auth.uid());
create policy "users delete own notifications" on public.mz_notifications for delete to authenticated using(user_id=auth.uid());
create policy "authenticated create notifications" on public.mz_notifications for insert to authenticated with check(actor_id=auth.uid() or actor_id is null);
create policy "users manage notification preferences" on public.mz_notification_preferences for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users manage push subscriptions" on public.mz_push_subscriptions for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users create reports" on public.mz_reports for insert to authenticated with check(reporter_id=auth.uid());
create policy "users see own reports" on public.mz_reports for select to authenticated using(reporter_id=auth.uid() or public.mz_is_admin());
create policy "admins update reports" on public.mz_reports for update to authenticated using(public.mz_is_admin());

alter publication supabase_realtime add table public.mz_notifications;
