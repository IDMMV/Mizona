# Etapa 15 · Mi Comunidad multiusuario local

## Objetivo

Permitir probar el módulo Mi Comunidad entre varios perfiles locales sin depender de Supabase.

## Pruebas sugeridas

### Colegio

1. Usa José en una pestaña y abre Colegio San Martín.
2. Usa Ian, Dylan o la Profesora Ana en otra pestaña.
3. Publica un comunicado o evento desde José o la profesora.
4. Verifica la notificación en la otra pestaña.
5. Crea un aula y confirma que aparece un nuevo chat escolar.
6. Sube un PDF, Word, Excel o imagen y comprueba su descarga.

### Comité

1. Usa María y abre Comité Vecinal Los Pinos.
2. Usa otro perfil y solicita ingreso.
3. Como el comité es abierto, la membresía queda activa.
4. Publica un aviso y verifica la actualización en la otra pestaña.

### Solicitud de comunidad

1. Usa Carlos u otro usuario normal.
2. Crea una comunidad nueva.
3. Cambia a José o María con rol administrador.
4. Abre la pestaña Solicitudes y aprueba o rechaza la comunidad.

## Datos locales

- Comunidades y contenido: `localStorage`.
- Archivos: `IndexedDB`.
- Perfil activo por pestaña: `sessionStorage`.
- Actualización entre pestañas: `BroadcastChannel` y eventos de almacenamiento.

## Limitación

Los datos no se comparten entre navegadores o dispositivos distintos. La seguridad y los roles son simulados para pruebas.
