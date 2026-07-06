-- OPCIONAL: ejecutar después de ETAPA12_CHAT_REAL.sql.
-- Programa la limpieza de mensajes y archivos vencidos cada hora.
-- Si tu proyecto no permite pg_cron, omite este archivo y ejecuta
-- manualmente: select public.mz_chat_cleanup_expired();

create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname='mizona-chat-limpieza-horaria';

select cron.schedule(
  'mizona-chat-limpieza-horaria',
  '15 * * * *',
  $$ select public.mz_chat_cleanup_expired(); $$
);
