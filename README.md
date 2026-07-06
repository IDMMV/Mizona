# MiZona Enterprise V8 — Etapa 14

## Laboratorio multiusuario local

Versión acumulativa construida sobre las Etapas 10–13. Esta entrega continúa sin Supabase y permite probar flujos de varios usuarios dentro del mismo navegador.

## Incluye

- Perfiles locales independientes por pestaña.
- Creación, selección y eliminación de perfiles de prueba.
- Solicitudes de contacto entre perfiles.
- Contactos aceptados y bloqueos por usuario.
- Conversaciones privadas y grupos compartidos.
- Mensajes y archivos visibles en varias pestañas mediante almacenamiento local y BroadcastChannel.
- Notificaciones separadas por usuario.
- Conteos de mensajes no leídos por perfil.
- Reglas de búsqueda para estudiantes vinculados al mismo colegio.
- Roles locales para probar Centro de Control.
- Respaldo JSON compatible con la Etapa 13.
- PWA y funcionamiento sin conexión.

## Ejecutar

```bash
npm install
npm run dev
npm run build
```

## Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

## Importante

Este laboratorio no reemplaza la autenticación ni la seguridad real del backend. Los perfiles comparten el mismo navegador y sirven exclusivamente para pruebas funcionales mientras Supabase está temporalmente fuera de servicio.
