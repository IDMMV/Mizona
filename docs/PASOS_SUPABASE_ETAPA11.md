# Activar la Etapa 11 en Supabase

## 1. Confirma la Etapa 10

Debes tener funcionando:

- registro e inicio de sesión;
- tabla `profiles`;
- roles `user`, `admin` y `super_admin`;
- variables de Supabase en Vercel.

## 2. Ejecuta el SQL

En Supabase abre **SQL Editor**, crea una consulta nueva y pega todo el contenido de:

```text
supabase/ETAPA11_COMUNIDAD_REAL.sql
```

Presiona **Run** una sola vez y confirma que aparezca `Success`.

Para una instalación nueva puedes usar:

```text
supabase/ETAPA10_Y_11_COMPLETO.sql
```

## 3. Verifica Storage

En **Storage** debe aparecer el bucket privado:

```text
community-files
```

Límite configurado: 20 MB por archivo.

## 4. Prueba completa

1. Registra tu cuenta principal.
2. Confirma que sea `super_admin` en `profiles`.
3. Crea una segunda cuenta normal.
4. Con la segunda cuenta solicita una comunidad.
5. Con la cuenta principal entra a Mi Comunidad → Solicitudes.
6. Aprueba la comunidad.
7. Vuelve a la cuenta normal y publica un comunicado.
8. Sube un PDF o imagen.
9. Comprueba que otra cuenta sin membresía no pueda abrir el documento.

## 5. Publica en Vercel

Sube todo el contenido de esta versión a la raíz de GitHub. Vercel debe usar:

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

No subas solamente `index.html` ni solamente `dist`.
