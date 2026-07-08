# MiZona Enterprise V8 — Etapa 29

## Supabase y usuarios reales

Versión acumulativa construida sobre la Etapa 28.1. Activa la conexión real con Supabase, autenticación, perfiles, módulos y notificaciones reales.

### Incluye
- Pantalla de acceso obligatoria cuando el modo nube está activo y no existe sesión.
- Registro con correo, contraseña, usuario único, zona y tipo de cuenta.
- Confirmación de correo y recuperación de contraseña.
- Perfil real desde `profiles`.
- Módulos desde `app_modules`.
- Notificaciones desde `mz_notifications` con Realtime.
- Centro administrativo **Supabase real** con diagnóstico de Auth, tablas y Storage.
- Cambio controlado entre modo local y nube.
- Conserva el modo local como contingencia.

### Variables de Vercel
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

### Publicación
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
