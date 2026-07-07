# MiZona Enterprise V8 — Etapa 25

## Notificaciones reales y archivos en nube preparados

Versión acumulativa construida sobre las Etapas 1–24. Funciona sin Supabase y conserva los datos en el navegador.

### Incluye

- Nuevo módulo **Nube y Push** visible para administradores.
- Preparación de notificaciones push del navegador.
- Plantillas de avisos por Chat, Comunidad, Business, Pagos y Ride.
- Envíos simulados por navegador, correo futuro, WhatsApp futuro y SMS futuro.
- Segmentación protegida para estudiantes y adultos.
- Registro local de archivos por módulo.
- Reglas de retención: 7, 30, 180 y 365 días.
- Cola local de subida futura.
- Buckets planificados para Chat, Transfer, Business, Verificación y Marketplace.
- Estados de archivo: limpio, cuarentena, bloqueado, listo nube, vencido.
- Bloqueo de ejecutables y archivos peligrosos.
- Reporte JSON de configuración, archivos y envíos.
- Service Worker preparado para eventos push futuros.
- Auditoría local y cola de sincronización futura.

### Ejecutar

```bash
npm install
npm run dev
npm run build
```

### Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

### Estado honesto

Esta etapa todavía no sube archivos a Internet ni envía push real desde un servidor. Permite probar flujos, reglas, permisos, retención, plantillas y seguridad antes de conectar almacenamiento real y proveedor de notificaciones.
