# Etapa 16 · Beneficios multiusuario local

## Objetivo

Probar el ciclo completo de publicación, moderación y uso de beneficios sin depender de Supabase.

## Flujo recomendado

1. Abre MiZona en dos pestañas.
2. Usa Carlos en la primera pestaña y crea una oportunidad.
3. La publicación quedará pendiente.
4. Usa José o María en la segunda pestaña.
5. Abre Centro de Control → Beneficios y aprueba la publicación.
6. Regresa a Carlos y verifica la notificación.
7. Cambia a otro perfil y guarda o usa la oportunidad.
8. Comprueba que el responsable recibe una notificación.

## Datos locales

- Oportunidades, guardados, acciones y reportes: `localStorage`.
- Perfil activo por pestaña: `sessionStorage`.
- Actualización: `BroadcastChannel` y evento `storage`.
- Auditoría, notificaciones y cola futura: estado local general de MiZona.

## Restricciones simuladas

- Los estudiantes no publican oportunidades públicas.
- Los administradores pueden aprobar, verificar, pausar o rechazar.
- Los perfiles normales requieren aprobación.
- Un usuario no puede usar su propia publicación.
- Cupones, postulaciones y reservas no se duplican para el mismo perfil.

## Limitación

Los datos no se comparten entre navegadores o dispositivos distintos. La seguridad es de laboratorio y no sustituye RLS ni backend.
