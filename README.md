# MiZona Enterprise V8 — Etapa 30.1

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


## Etapa 30 · Finanzas personales

Se agregó el módulo **Mis gastos** para que cada usuario administre sus ingresos, gastos, ahorros, metas y presupuestos personales. En modo local se separa por perfil y en Supabase queda preparado con tablas privadas mediante RLS.

### SQL adicional

Ejecutar una sola vez:

```text
supabase/ETAPA30_FINANZAS_PERSONALES.sql
```


## Corrección 30.1

- El botón **Contactar por Chat** en Negocios ya no envía al usuario a una conversación vacía cuando la ficha es de demostración/local.
- En modo nube, el chat real se abre solo para negocios con propietario real registrado en Supabase.
- Si la ficha todavía usa un propietario local de ejemplo, MiZona muestra un aviso claro para reclamar o crear el negocio con una cuenta real.
- Cuando se crea una conversación válida, Chat la abre automáticamente.
- El botón físico **atrás** del celular retrocede dentro de MiZona en vez de sacar inmediatamente del aplicativo.
