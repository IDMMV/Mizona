# Etapa 21 · IA MiZona multiusuario local

## Objetivo

Probar la experiencia completa del asistente sin Supabase ni claves externas, manteniendo privacidad, historial por perfil, planes guardados, filtros de seguridad y administración local.

## Datos consultados

El motor usa únicamente conteos y resúmenes locales de:

- Mi Comunidad y Comités
- MiZona Chat y Notificaciones
- Beneficios
- Negocios y Marketplace
- CampusHugo
- MiZona Business
- MiZona Ride

No envía mensajes privados, contraseñas ni archivos al endpoint opcional.

## Perfiles

Cada perfil local conserva conversaciones, favoritos y planes separados. Las cuentas estudiantiles no tienen acceso por defecto.

## Motor local

El motor local es determinista y basado en reglas. Produce planes y accesos directos según palabras clave y datos resumidos del navegador.

## Endpoint opcional

La interfaz admite `VITE_AI_ENDPOINT`, pero la clave del proveedor debe permanecer en un servidor propio. El navegador solo llama al endpoint seguro.
