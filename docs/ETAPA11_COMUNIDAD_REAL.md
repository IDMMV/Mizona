# Etapa 11 · Mi Comunidad real

## Objetivo

Convertir Mi Comunidad en el primer módulo funcional que atraiga usuarios a MiZona mediante colegios, comités y organizaciones locales.

## Flujo implementado

1. El usuario se registra e inicia sesión.
2. Solicita una comunidad indicando nombre, tipo, zona, visibilidad y forma de ingreso.
3. La comunidad queda pendiente, excepto cuando la crea un administrador de plataforma.
4. El administrador de MiZona aprueba o rechaza la solicitud.
5. Los usuarios pueden unirse de forma abierta, solicitar aprobación o utilizar un código.
6. El propietario y los administradores administran miembros y roles.
7. El personal autorizado publica comunicados, eventos y aulas.
8. Los miembros suben y descargan documentos privados.

## Roles de comunidad

- `owner`: propietario de la comunidad.
- `admin`: administrador interno.
- `moderator`: moderador.
- `teacher`: profesor con permiso para publicar y crear aulas.
- `parent`: padre o madre.
- `student`: estudiante.
- `member`: miembro general.

## Seguridad

- Las comunidades pendientes solo son visibles para su propietario y administradores de plataforma.
- Las comunidades privadas solo son visibles para sus miembros.
- Los códigos de ingreso se almacenan cifrados con `crypt` y no pueden consultarse directamente desde el navegador.
- Los documentos se guardan en un bucket privado.
- Los miembros solo acceden a archivos de comunidades donde tienen membresía activa.
- El propietario de una comunidad no puede aprobar por sí mismo el estado general de la comunidad.
- Los perfiles completos solo se comparten entre miembros activos de una misma comunidad.

## Próxima etapa

Etapa 12: MiZona Chat real, invitaciones exactas por usuario, conversaciones, grupos escolares, mensajes en tiempo real y archivos temporales.
