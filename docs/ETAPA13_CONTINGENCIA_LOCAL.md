# Etapa 13 · Notificaciones, moderación y contingencia local

## Objetivo

Mantener MiZona utilizable mientras Supabase no está disponible, sin perder el avance del frontend ni bloquear las pruebas en Vercel.

## Almacenamiento

- `localStorage`: contactos, solicitudes, chats, mensajes, notificaciones, reportes, auditoría y cola local.
- `IndexedDB`: archivos adjuntos del chat de hasta 25 MB.
- Service Worker: interfaz básica y recursos estáticos en caché.

## Pruebas recomendadas

1. Abrir MiZona Chat y enviar un mensaje.
2. Actualizar el navegador y comprobar que el mensaje permanece.
3. Crear un grupo.
4. Adjuntar un archivo y descargarlo.
5. Reportar un mensaje.
6. Revisar el reporte en Centro de Control > Moderación local.
7. Abrir Notificaciones y marcar avisos como leídos.
8. Descargar un respaldo JSON desde Configuración > Datos locales.
9. Probar la aplicación sin conexión después de haberla abierto al menos una vez.

## Limitaciones

No hay sincronización entre dispositivos, autenticación real, correos, Realtime ni seguridad RLS mientras se utiliza el modo local.
