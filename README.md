# MiZona Enterprise V8 — Etapa 13: Contingencia local

Versión acumulativa construida sobre las Etapas 10, 11 y 12. Esta entrega permite continuar trabajando **sin Supabase** mientras el panel o la base externa no estén disponibles.

## Funciones nuevas

- Modo local activado por defecto, incluso si Vercel conserva variables de Supabase.
- MiZona Chat persistente en este dispositivo.
- Contactos, solicitudes, grupos y mensajes guardados en `localStorage`.
- Archivos de chat de hasta 25 MB guardados en `IndexedDB`.
- Descarga local de archivos adjuntos.
- Centro de notificaciones con lectura, filtros y eliminación.
- Moderación local de reportes desde Centro de Control.
- Auditoría local de acciones.
- Cola de acciones preparada para una sincronización futura.
- Limpieza de mensajes y archivos vencidos a los 7 días.
- Exportación e importación de respaldo JSON.
- PWA y funcionamiento básico sin conexión.

## Importante

El modo local es una contingencia de desarrollo y pruebas:

- Los datos existen solo en el navegador y dispositivo usados.
- El respaldo JSON no incluye el contenido binario de los archivos guardados en IndexedDB.
- No existe autenticación real ni comunicación entre distintos usuarios o dispositivos.
- No se debe considerar todavía una plataforma multiusuario de producción.
- Cuando Supabase vuelva, primero se verificará la Etapa 12 antes de diseñar la sincronización.

## Ejecutar

```bash
npm install
npm run dev
npm run build
```

## Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

No necesitas modificar ni eliminar las variables de Supabase. MiZona inicia en modo local y no realiza llamadas a Supabase hasta cambiar manualmente a modo nube desde Configuración.
