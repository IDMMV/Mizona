# MiZona Enterprise V8 - Etapa 30.39

## Enfoque
Depuración del módulo Comité antes de continuar con nuevas funciones.

## Cambios incluidos

### Menú Comité
- Se agregó vista agrupada:
  - Participantes e Integrantes
  - Finanzas
  - Calendario y Agenda
  - Actas y Documentos
- Se mantienen las vistas internas antiguas para no perder funciones ni romper el flujo.

### Excel
- Se agregó barra de importar/exportar Excel en Participantes e Integrantes.
- Se agregó barra de importar/exportar Excel en Finanzas.
- Se agregó barra de importar/exportar Excel en Actas y Documentos.
- Los botones indican formato `.xlsx`.
- La exportación sigue generando Excel real con hojas ordenadas.
- La importación avanzada `.xlsx` queda preparada para conectarse por plantilla.

### Finanzas
- Nueva vista agrupada de Finanzas.
- Incluye accesos rápidos a:
  - Cuotas
  - Pagos
  - Gastos
- KPIs financieros:
  - Total cuotas
  - Pagado
  - Pendiente
  - Gastos
  - Saldo

### Calendario
- Se mejoró selección de día.
- Al seleccionar un día, queda marcado visualmente.
- La versión móvil del calendario se ajusta mejor para que se aprecie completo.

### Actas y Documentos
- Nueva vista agrupada.
- Accesos rápidos a:
  - Actas
  - Documentos
  - Descargas
- Todo queda descargable/exportable.

### Reportes
- Se renombró como dashboard interactivo y exportación.
- Preparado para mostrar KPIs y exportaciones.

## Verificación

```bash
npm run build
```

Build verificado correctamente.
