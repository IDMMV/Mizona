# MiZona 30.97 — auditoría previa a Supabase

## Objetivo
Dejar el proyecto compilable, con una sola raíz React, controles de colecciones incompletas y un mapa claro para retirar el almacenamiento local en la siguiente etapa.

## Correcciones aplicadas
- Una sola raíz React en `src/main.jsx`.
- `AppRoot.jsx` ya no importa `createRoot`, `ErrorBoundary` ni `AppProvider` innecesariamente.
- Protección de arreglos en Notificaciones, Verificación, Administración y Shell.
- Utilidades compartidas en `src/lib/runtimeSafety.js`.
- Preflight automático con `npm run preflight`.
- Verificación completa con `npm run verify`.
- Node 24 fijado para Vercel.

## Dependencias locales que todavía deben migrarse
Los módulos `src/lib/local*.js` siguen siendo la fuente temporal de datos. No se eliminaron todavía porque hacerlo antes de crear tablas, RLS y servicios Supabase rompería las pantallas existentes.

También quedan preferencias de interfaz en `localStorage` o `sessionStorage`: tema, menú lateral y ruta temporal del chat. En la etapa final se decidirá cuáles son preferencias no sensibles permitidas y cuáles deben ir a `user_preferences` en Supabase.

## Orden obligatorio de la etapa final
1. Crear esquema SQL y políticas RLS.
2. Implementar autenticación y perfiles.
3. Sustituir cada `local*.js` por repositorios Supabase.
4. Migrar Storage y archivos.
5. Activar Realtime.
6. Crear notificaciones internas y push.
7. Retirar datos demo y funciones locales.
8. Ejecutar pruebas con dos usuarios y dos dispositivos.

## Criterio de salida
No se considerará finalizada la migración mientras exista información funcional del usuario guardada por módulos `local*.js`.
