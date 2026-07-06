# MiZona Enterprise V8 — Etapa 12: MiZona Chat Real

Versión acumulativa construida sobre las Etapas 10 y 11.

## Incluye

- Búsqueda de personas únicamente por usuario exacto.
- Solicitudes de contacto: enviar, aceptar y rechazar.
- Bloqueo bidireccional y eliminación del contacto.
- Conversaciones privadas entre contactos aceptados.
- Grupos privados y grupos escolares vinculados a comunidad o aula.
- Mensajes en tiempo real con Supabase Realtime.
- Imágenes y documentos privados de hasta 25 MB.
- Enlaces de descarga temporales.
- Retención inicial de mensajes y archivos por 7 días.
- Restricciones especiales para cuentas estudiantiles.
- Reportes visibles en el Centro de Control.
- Políticas RLS y bucket privado `chat-files`.

## Orden correcto

1. Las Etapas 10 y 11 deben estar instaladas sin errores.
2. Ejecuta `supabase/ETAPA12_CHAT_REAL.sql` en Supabase SQL Editor.
3. Comprueba que los seis resultados finales aparezcan en `true`.
4. El archivo `ETAPA12_LIMPIEZA_AUTOMATICA_OPCIONAL.sql` es opcional.
5. Sube todo el proyecto a GitHub.
6. Vercel debe usar Vite, `npm run build` y salida `dist`.

## Desarrollo local

```bash
npm install
npm run dev
npm run build
```

## Variables de Vercel

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Estado

La interfaz, las operaciones de contacto, las conversaciones, los mensajes, el almacenamiento privado y Realtime están conectados a Supabase. La limpieza horaria de archivos vencidos requiere ejecutar el SQL opcional de Cron o llamar periódicamente a `public.mz_chat_cleanup_expired()` desde una tarea segura.
