# MiZona Enterprise V8 — Etapa 15

## Mi Comunidad multiusuario local

Versión acumulativa construida sobre las Etapas 10–14. Esta entrega continúa sin Supabase y convierte **Mi Comunidad** en un laboratorio funcional compartido entre varias pestañas del mismo navegador.

## Incluye

- Comunidades locales para colegios, comités, clubes, urbanizaciones, empresas, iglesias y asociaciones.
- Perfiles diferentes por pestaña.
- Creación de comunidades activas o pendientes según el rol local.
- Aprobación y rechazo de comunidades por administradores.
- Ingreso abierto, mediante solicitud, código o invitación.
- Membresías con roles de propietario, administrador, moderador, profesor, padre, estudiante y miembro.
- Aprobación, rechazo y bloqueo de integrantes.
- Comunicados compartidos entre perfiles.
- Eventos comunitarios con fecha, lugar y audiencia.
- Aulas escolares vinculadas automáticamente a un chat local.
- Documentos comunitarios de hasta 20 MB guardados en IndexedDB.
- Notificaciones por solicitudes, aprobaciones, comunicados, eventos y aulas.
- Auditoría y cola local para sincronización futura.
- Actualización entre pestañas mediante BroadcastChannel y almacenamiento local.
- Todo lo incorporado en Chat, grupos, archivos y laboratorio multiusuario de la Etapa 14.

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

## Cómo probar

1. Abre MiZona en dos pestañas.
2. En la primera usa José, María o un administrador.
3. En la segunda usa Carlos, Ian, Dylan u otro perfil.
4. Entra a **Mi Comunidad** desde ambas pestañas.
5. Solicita ingreso, crea una comunidad, publica un comunicado o sube un documento.
6. Comprueba que los cambios aparecen en la otra pestaña.

## Importante

Esta etapa sirve para pruebas funcionales locales. No sustituye autenticación, seguridad, almacenamiento ni sincronización real entre dispositivos. Cuando Supabase vuelva a estar disponible, estos flujos se conectarán nuevamente al backend.
