# login-by-username

Permite iniciar sesión con el usuario único de MiZona sin exponer el correo.

## Desplegar

```bash
supabase functions deploy login-by-username
```

La función usa automáticamente estos secretos del proyecto:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

En producción se recomienda añadir CAPTCHA o rate limiting adicional.
