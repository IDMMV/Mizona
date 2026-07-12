# MiZona Enterprise V8 · 30.62 · Chat funcional completo

## Cambios reales

- Ubicación actual como tarjeta con coordenadas, Google Maps, compartir y WhatsApp.
- Ubicación en tiempo real mediante `watchPosition`, activa mientras la app permanece abierta.
- Solicitud explícita de permiso antes de compartir ubicación.
- Encuestas votables dentro del chat; los votos se envían como mensajes estructurados y se agregan por usuario.
- Eventos con confirmación de asistencia y descarga `.ics` para calendario.
- Contactos compartidos con botones Llamar, WhatsApp y Copiar.
- Pedidos con cantidad, precio, total y estados pendiente/confirmado/preparando/entregado.
- Catálogo con producto, precio, disponibilidad y botón Pedir.
- Respuestas rápidas seleccionables.
- Grabación real de notas de voz con permiso del micrófono.
- Centro de acciones con contenido real de pedidos, encuestas, eventos y archivos.
- Vista previa legible en la lista de conversaciones para mensajes estructurados.

## Requisitos del navegador

- Ubicación y micrófono requieren HTTPS (Vercel lo proporciona) y permiso del usuario.
- La ubicación en tiempo real se detiene si el navegador cierra la página o suspende la PWA.
