# MiZona Enterprise V8 — Etapa 16

## Beneficios y oportunidades multiusuario local

Versión acumulativa construida sobre las Etapas 10–15. Continúa sin Supabase y convierte **Beneficios** en un módulo funcional compartido entre varias pestañas del mismo navegador.

## Incluye

- Ofertas, empleos, eventos, campañas y cupones locales.
- Creación de oportunidades por perfiles adultos.
- Publicación inmediata para administradores y revisión para usuarios normales.
- Moderación desde el Centro de Control: aprobar, verificar, pausar y rechazar.
- Guardados independientes por perfil.
- Cupones con código local único.
- Postulaciones, reservas, asistencias y solicitudes.
- Stock o cupos que disminuyen con cada acción.
- Cancelación de acciones y devolución del cupo.
- Reportes de publicaciones y revisión administrativa.
- Métricas locales de vistas y acciones.
- Notificaciones al responsable y a los administradores.
- Auditoría y cola para sincronización futura.
- Actualización entre pestañas mediante BroadcastChannel.
- Todo lo incorporado en Chat, grupos, archivos y Mi Comunidad.

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

## Importante

Esta etapa funciona entre pestañas del mismo navegador y dispositivo. No reemplaza autenticación, moderación ni sincronización real entre celulares o computadoras. No requiere ejecutar SQL.
