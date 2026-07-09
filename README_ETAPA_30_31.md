# MiZona Enterprise V8 - Etapa 30.31

## Corrección principal
Chat sin parpadeo blanco al abrir una conversación.

## Qué se cambió
- El modo pantalla completa se activa antes de cargar mensajes.
- Se aplica el fondo del chat al body antes del render de la conversación.
- Se evita el fondo blanco intermedio.
- Se agrega transición corta de entrada.
- Se muestra un pequeño estado “Abriendo conversación…” sobre el mismo fondo del chat.
- Se mantiene el comportamiento de volver a lista con “Ver chats”.

## Instalación
```bash
npm install
npm run dev
```

## Verificación
```bash
npm run build
```
Build verificado correctamente.
