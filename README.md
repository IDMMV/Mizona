# MiZona Enterprise V8 — Etapa 24

## Usuarios reales y sincronización preparada

Versión acumulativa construida sobre las Etapas 1–23. Funciona sin Supabase y conserva los datos en el navegador.

### Incluye

- Nuevo módulo **Usuarios y Sync** visible solo para administradores.
- Estado del backend, modo local/nube, internet y Supabase.
- Revisión automática de preparación antes de migrar.
- Resumen de perfiles, estudiantes, administradores, mensajes, adjuntos y cola local.
- Plan de migración local para pasar de pruebas a usuarios reales.
- Reglas de sincronización: respaldo obligatorio, política de conflictos y protección de menores.
- Control de dispositivos confiables y códigos locales de vinculación.
- Exportación de respaldo local completo.
- Importación de respaldo JSON.
- Descarga del plan de migración en JSON.
- Checklist por bloques: perfiles, módulos, comunidad, chat, archivos, pagos y verificación.

### Estado honesto

Esta etapa todavía no sincroniza entre celulares o computadoras diferentes. Su función es preparar el paso seguro desde el modo local hacia un backend real, evitando perder datos y manteniendo roles seguros.

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
