# Etapa 10 · Núcleo real de producción

Esta etapa convierte la base visual en el primer núcleo conectado de MiZona.

## Incluye

- Sesiones persistentes con Supabase Auth.
- Registro con correo, contraseña, usuario único, tipo de cuenta, zona y aceptación de términos.
- Inicio de sesión por correo.
- Inicio de sesión por usuario mediante Edge Function incluida.
- Recuperación y cambio de contraseña.
- Perfil vinculado a `auth.users`.
- Roles `user`, `admin` y `super_admin`.
- Centro de Control oculto para usuarios sin permiso.
- Estados de módulos cargados y guardados en Supabase.
- Auditoría básica de cambios de módulos.
- RLS para perfiles, términos, módulos, preferencias y auditoría.
- Buckets base para avatares y archivos privados.
- Búsqueda exacta segura de perfiles mediante RPC.
- Bloqueo de estudiantes en búsqueda global.

## Orden para instalar

1. Crea una copia de seguridad del proyecto Supabase.
2. Ejecuta `supabase/schema.sql` si todavía no instalaste las tablas anteriores.
3. Ejecuta `supabase/ETAPA10_EJECUTAR.sql`.
4. Registra tu cuenta desde MiZona.
5. Usa la sentencia comentada al final del SQL para convertir tu correo en `super_admin`.
6. Configura en Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Despliega la Edge Function `login-by-username` para habilitar acceso por usuario.

## Importante

No coloques la `service_role` en Vercel ni en el navegador. Esa clave solo se usa dentro de Supabase Edge Functions.
