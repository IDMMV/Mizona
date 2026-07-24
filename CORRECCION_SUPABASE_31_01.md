# MiZona 31.01 · Corrección de instalación Supabase

## Por qué aparecía el error
La primera ejecución SQL quedó a medias. Algunas tablas/triggers existían y `mz_user_profiles` no. Por eso la web podía autenticar al usuario en `auth.users`, pero no encontraba su perfil ni su rol.

## Instalación correcta
1. Abre Supabase > SQL Editor.
2. Ejecuta completo `supabase/INSTALAR_MIZONA_ESTUDIANTES_31_01.sql`.
3. Debe finalizar sin error.
4. En Table Editor confirma `mz_user_profiles`.
5. El correo `josehugo.tec@gmail.com` queda como `super_admin` y `verified`.
6. Despliega esta versión y vuelve a iniciar sesión.

El script conserva los usuarios de Supabase Auth. Solo reconstruye tablas `mz_*`.
