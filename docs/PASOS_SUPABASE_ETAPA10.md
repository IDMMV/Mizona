# Pasos exactos para activar la Etapa 10

## A. Supabase

1. Abre tu proyecto Supabase.
2. Entra en **SQL Editor**.
3. Si nunca instalaste la base anterior, ejecuta primero `supabase/schema.sql`.
4. Ejecuta completo `supabase/ETAPA10_EJECUTAR.sql`.
5. En **Authentication > URL Configuration** agrega:
   - Site URL: tu dominio de Vercel.
   - Redirect URL: tu dominio de Vercel con `/**`.
6. En **Authentication > Providers > Email** deja activo correo y contraseña.

## B. Vercel

En **Settings > Environment Variables** agrega:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Luego realiza un nuevo deployment.

## C. Crear el primer administrador

1. Abre MiZona y registra tu cuenta.
2. Regresa al SQL Editor.
3. Ejecuta, cambiando el correo:

```sql
update public.profiles p
set role = 'super_admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('TU_CORREO@EJEMPLO.COM');
```

4. Cierra sesión y vuelve a ingresar.
5. El Centro de Control aparecerá únicamente para el administrador.

## D. Activar inicio de sesión por usuario

Con Supabase CLI:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy login-by-username
```

Hasta desplegar la función, el inicio por correo funciona normalmente.
