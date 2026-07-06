# Etapa 14 · Laboratorio multiusuario local

## Objetivo

Probar el flujo completo de MiZona Chat sin depender de Supabase. Cada pestaña puede mantener un perfil activo distinto mediante `sessionStorage`, mientras todos los perfiles comparten la base local de prueba almacenada en `localStorage` e IndexedDB.

## Prueba recomendada

1. Abre MiZona y entra a **Laboratorio local**.
2. Usa a José en la primera pestaña.
3. Pulsa **Abrir segunda sesión**.
4. En la segunda pestaña selecciona a Carlos, María, Ian o un perfil creado por ti.
5. Busca el usuario exacto desde MiZona Chat.
6. Envía una solicitud.
7. Acepta la solicitud desde la otra pestaña.
8. Inicia la conversación y envía mensajes desde ambos perfiles.
9. Verifica las notificaciones y los contadores no leídos.

## Seguridad escolar simulada

- Ian y Dylan comparten `school_id = san-martin`.
- José está vinculado como padre.
- Profesora Ana está vinculada como docente.
- Un adulto externo no puede encontrar estudiantes mediante búsqueda exacta.
- Los grupos escolares validan que sus integrantes pertenezcan al mismo colegio.

## Limitaciones

- No existe verificación de identidad.
- No se guardan contraseñas.
- No hay cifrado de extremo a extremo.
- Los datos existen solo en este navegador.
- La sincronización entre dispositivos dependerá del backend futuro.
