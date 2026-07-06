# MiZona Enterprise V8 · Etapa 10 Núcleo Real

Versión acumulativa de MiZona con el primer núcleo conectado a producción.

## Lo nuevo

- Autenticación real con Supabase.
- Registro, inicio de sesión, recuperación y cambio de contraseña.
- Usuario único validado y filtrado.
- Perfil vinculado a `auth.users`.
- Roles y protección del Centro de Control.
- Módulos administrables con persistencia real.
- RLS, auditoría, términos, preferencias y Storage base.
- Edge Function para iniciar sesión con usuario o correo.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
```

## Configurar Supabase

1. Copia `.env.example` como `.env`.
2. Coloca la URL y clave anónima del proyecto.
3. Ejecuta `supabase/schema.sql` si corresponde.
4. Ejecuta `supabase/ETAPA10_EJECUTAR.sql`.
5. Revisa `docs/ETAPA10_NUCLEO_REAL.md`.

## Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Estado honesto

Esta etapa hace reales la autenticación, los perfiles, roles y estados de módulos después de configurar Supabase. Comunidad, Chat, Transfer, Marketplace, CampusHugo, Business, Ride e IA todavía conservan partes demostrativas y se conectarán progresivamente en las siguientes etapas técnicas.
