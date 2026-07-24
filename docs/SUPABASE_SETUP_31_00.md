# MiZona Estudiantes 31.00 — instalación Supabase

1. Crea o abre el proyecto de Supabase.
2. En SQL Editor ejecuta completo: `supabase/migrations/202607240001_mizona_students.sql`.
3. En Authentication > URL Configuration registra el dominio de Vercel y `http://localhost:5173`.
4. En Vercel agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. En Authentication activa confirmación de correo y configura SMTP propio antes de producción.
6. Crea al primer administrador y luego ejecuta, reemplazando el correo:

```sql
update public.mz_user_profiles p
set role='super_admin', verification_status='verified'
from auth.users u
where p.user_id=u.id and u.email='TU_CORREO';
```

## Alcance implementado

- Supabase Auth obligatorio.
- Perfil estudiantil en `mz_user_profiles`.
- Instituciones verificadas.
- Comunidades.
- Red de ayuda.
- Notificaciones internas en tiempo real.
- Moderación básica.
- Sin modo de datos local en la aplicación activa.

Los módulos antiguos permanecen en el código como legado, pero ya no forman parte de la navegación ni de `AppRoot`.
