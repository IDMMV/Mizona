# MiZona Enterprise V8 - Etapa 30.33

## MiZona Chat avanzado

Cambios incluidos:

- Botón Ajustes a la altura de MiZona Chat.
- Botón Salir alineado arriba para ganar espacio.
- Ajustes del chat:
  - Foto de perfil local.
  - Nombre visible.
  - Frase / estado.
  - Tema, color y fondo del chat.
  - Agregar usuario.
  - Invitar amigo con código.
  - Límite de 20 fotos por envío.
- Menú de adjuntos tipo bandeja:
  - Fotos y videos.
  - Documentos.
  - Audio.
  - Ubicación.
  - Contacto.
  - Encuesta.
  - Evento.
  - Pedido.
  - Catálogo.
  - Respuesta rápida.
- Envío múltiple de archivos con límite de 20 fotos.
- En los mensajes solo se muestra la hora.
- Separadores por fecha: Hoy, Ayer o fecha completa.
- Ubicación actual usando permisos del navegador y enlace directo a Google Maps.
- Base para ubicación en tiempo real.
- Encuestas creadas dentro del mismo chat como mensaje.
- Eventos creados dentro del mismo chat como mensaje.
- Centro de acciones del chat:
  - Pendientes.
  - Pedidos.
  - Encuestas.
  - Eventos.
  - Archivos.
  - Resumen automático base.

## Notas importantes

Algunas funciones quedan como base funcional dentro del chat usando mensajes especiales. Para la siguiente etapa se pueden convertir en registros reales de base de datos: encuestas votables, pedidos registrados, eventos con confirmación, ubicación en tiempo real persistente y acciones con estados.

## Verificación

```bash
npm install
npm run build
```

Build verificado correctamente.
