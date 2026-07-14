# MiZona 30.70 — Sincronización híbrida

- Conserva cambios localmente cuando no hay Internet.
- Sube eventos por lotes a Supabase cuando vuelve la conexión.
- Marca cada acción como sincronizada o fallida.
- Incluye Marketplace, Business, Ride, pagos, comités, Campus, beneficios, archivos y acciones del chat mediante la cola existente.

Ejecutar `supabase/migrations/202607130170_app_sync_events.sql` en Supabase SQL Editor.
