# Pasos de la Etapa 29

1. En Supabase abre **Project Settings → API**.
2. Copia Project URL y anon public key.
3. En Vercel abre **Settings → Environment Variables**.
4. Crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. Vuelve a desplegar el proyecto.
6. Ingresa con un perfil administrador local y abre **Supabase real**.
7. Pulsa **Activar nube**.
8. Crea una cuenta con un correo real.
9. Confirma el correo recibido.
10. Inicia sesión y ejecuta el diagnóstico.

## Convertir la primera cuenta en superadministrador
En Supabase SQL Editor ejecuta, cambiando el correo:
```sql
update public.profiles p
set role = 'super_admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('TU_CORREO_REAL');
```
Después cierra sesión y vuelve a ingresar.
