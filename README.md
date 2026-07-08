# MiZona Enterprise V8 — Etapa 30.1

## Corrección comité móvil + participantes por cuota

Versión acumulativa construida sobre Etapa 30. Mantiene Supabase/Auth real y finanzas personales, y mejora el módulo **Comités**.

### Incluye

- Apariencia móvil mejorada para el módulo Comités.
- Pestañas ordenadas según el flujo real de trabajo:
  1. Inicio
  2. Participantes
  3. Cuotas
  4. Quién pagó
  5. Ingresos
  6. Gastos
  7. Comunicados
  8. Eventos
  9. Actas
  10. Documentos
  11. Reportes
  12. Configuración
- Nueva pestaña **Participantes**.
- Cada cuota o actividad puede tener participantes distintos.
- La cuota se cobra solo a quienes participan, no a todo el aula.
- Vista “Quién pagó” convertida en tarjetas móviles, sin tabla cortada.
- Formularios con etiquetas claras y ejemplos de qué colocar en cada cuadro.
- Configuración con descripción breve y ayudas por campo.
- Ayuda ordenada según las pestañas.
- Botón atrás del celular preparado para retroceder dentro de MiZona y entre pestañas principales.
- Migración automática de datos anteriores del comité.

### Ejecutar

```bash
npm install
npm run dev
npm run build
```

### Vercel

- Framework: **Vite**
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

### Supabase

No requiere SQL nuevo. Usa las tablas ya cargadas. Los cambios de participantes del comité continúan preparados localmente hasta conectar la sincronización completa del módulo Comités al backend.
