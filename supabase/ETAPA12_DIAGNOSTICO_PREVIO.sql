-- Ejecuta este diagnóstico antes de ETAPA12_CHAT_REAL.sql si deseas confirmar la base.
select
  to_regclass('public.profiles') is not null as profiles_ok,
  to_regclass('public.communities') is not null as communities_ok,
  to_regclass('public.community_members') is not null as community_members_ok,
  to_regclass('public.school_rooms') is not null as school_rooms_ok,
  to_regprocedure('public.is_admin(uuid)') is not null as is_admin_ok,
  to_regprocedure('public.is_community_member(uuid,uuid)') is not null as community_security_ok;
