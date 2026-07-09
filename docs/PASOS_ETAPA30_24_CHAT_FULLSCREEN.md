# Etapa 30.24 · Chat móvil pantalla completa

Correcciones aplicadas:

- En celular, una conversación se abre en pantalla completa tipo WhatsApp.
- Se oculta la barra superior, el menú inferior, el aviso global y el panel lateral mientras estás dentro de una conversación.
- El botón **Ver chats** y la flecha atrás regresan a la lista de conversaciones.
- Se evita que el usuario quede atrapado en un solo chat.
- La lista de chats conserva buscador, grupos, contactos y solicitudes.
- En PC y tablet se mantiene la vista dividida.
- El aviso de modo local queda fuera de la conversación fullscreen para no estorbar.

Archivo principal modificado:

- `src/pages/Chat.jsx`
- `src/styles/app.css`
