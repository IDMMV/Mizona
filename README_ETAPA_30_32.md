# MiZona Enterprise V8 - Etapa 30.32

## Corrección principal
Chat en modo app fullscreen real.

## Qué corrige
- Elimina la franja blanca inferior en el listado de chats.
- Reduce el parpadeo al abrir una conversación.
- El chat ocupa el 100% de la pantalla del navegador.
- Oculta topbar, sidebar y barra inferior mientras estás en MiZona Chat.
- La lista y la conversación se manejan como dos pantallas absolutas, similar a WhatsApp.
- Mantiene fondo estable antes, durante y después de abrir la conversación.
- No borra los mensajes anteriores antes de pintar la nueva conversación, evitando flash blanco.

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
