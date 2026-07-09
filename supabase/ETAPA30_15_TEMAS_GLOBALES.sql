-- =========================================================
-- MiZona Enterprise V8 · Etapa 30.15
-- Temas globales de plataforma + modo noche personal
-- Ejecutar completo en Supabase SQL Editor.
-- =========================================================

-- 1) Tabla de configuración global de plataforma.
-- Aquí el administrador define el color oficial de toda la web:
-- green = Verde fresco, blue = Azul moderno, purple = Morado suave.
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

-- Todos pueden leer la configuración visual global para que el tema cargue al abrir la web.
drop policy if exists "Leer configuración global de plataforma" on public.platform_settings;
create policy "Leer configuración global de plataforma"
on public.platform_settings
for select
using (true);

-- Solo administradores y super administradores pueden cambiar el color global.
drop policy if exists "Administradores gestionan configuración global" on public.platform_settings;
create policy "Administradores gestionan configuración global"
on public.platform_settings
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
);

-- Valor inicial recomendado.
insert into public.platform_settings (key, value, updated_at)
values (
  'appearance',
  jsonb_build_object(
    'ui_color', 'green',
    'allowed_colors', jsonb_build_array('green','blue','purple'),
    'mode_policy', 'personal',
    'note', 'El color es global para toda la plataforma. El modo noche es preferencia personal por usuario/dispositivo.',
    'updated_at', now()
  ),
  now()
)
on conflict (key) do nothing;

-- 2) Preferencia visual personal por usuario.
-- Cada usuario puede elegir claro/noche sin cambiar la marca global.
create table if not exists public.user_ui_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ui_mode text not null default 'light' check (ui_mode in ('light','dark')),
  updated_at timestamptz not null default now()
);

alter table public.user_ui_preferences enable row level security;

drop policy if exists "Cada usuario lee su apariencia" on public.user_ui_preferences;
create policy "Cada usuario lee su apariencia"
on public.user_ui_preferences
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Cada usuario guarda su apariencia" on public.user_ui_preferences;
create policy "Cada usuario guarda su apariencia"
on public.user_ui_preferences
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Cada usuario actualiza su apariencia" on public.user_ui_preferences;
create policy "Cada usuario actualiza su apariencia"
on public.user_ui_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 3) Realtime para que el color global pueda reflejarse sin recargar.
-- Si la tabla ya está agregada a la publicación, este bloque no falla.
do $$
begin
  alter publication supabase_realtime add table public.platform_settings;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 4) Verificación rápida.
select
  key,
  value->>'ui_color' as color_global,
  value->>'mode_policy' as politica_modo,
  updated_at
from public.platform_settings
where key = 'appearance';
