# Etapa 12 — MiZona Chat Real

## Arquitectura

La Etapa 12 utiliza tablas nuevas con prefijo `mz_` para no chocar con tablas antiguas de versiones anteriores:

- `mz_contact_requests`
- `mz_contacts`
- `mz_user_blocks`
- `mz_conversations`
- `mz_conversation_members`
- `mz_chat_messages`
- `mz_chat_attachments`
- `mz_chat_reports`

## Seguridad

- No existe un directorio público de usuarios.
- La búsqueda exige el nombre de usuario exacto.
- Los estudiantes solo pueden descubrir cuentas con relación escolar válida.
- Una conversación directa requiere contacto aceptado.
- Los archivos se guardan en un bucket privado.
- RLS valida la pertenencia a cada conversación.
- Los enlaces de archivos duran 120 segundos.
- Los mensajes y archivos vencen inicialmente en 7 días.

## Realtime

Se agregan a `supabase_realtime` las tablas de solicitudes, conversaciones, miembros y mensajes. La app actualiza las listas y el hilo activo cuando recibe cambios.

## Limpieza

`mz_chat_cleanup_expired()` elimina objetos vencidos del bucket y luego elimina mensajes expirados. Puede programarse con el archivo opcional de Cron.
