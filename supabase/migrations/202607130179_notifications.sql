create table if not exists public.mz_notification_devices(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, platform text not null, token text not null unique, device_name text, active boolean not null default true, updated_at timestamptz not null default now());
create table if not exists public.mz_notifications(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, category text not null default 'general', title text not null, body text not null, data jsonb not null default '{}'::jsonb, read_at timestamptz, created_at timestamptz not null default now());
create index if not exists mz_notifications_user_created_idx on public.mz_notifications(user_id,created_at desc);
alter table public.mz_notification_devices enable row level security; alter table public.mz_notifications enable row level security;
create policy "own device tokens" on public.mz_notification_devices for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own notifications" on public.mz_notifications for select using(user_id=auth.uid());
create policy "mark own notification" on public.mz_notifications for update using(user_id=auth.uid());
