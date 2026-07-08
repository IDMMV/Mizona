# Etapa 30.4 - Comité administrativo ordenado

Mejoras incluidas:

- Menú superior completo sin bloque de "Más" como listado interno.
- Participantes solo muestra padrón: alumno, apoderado, celular, DNI/código, dirección/nota.
- Cuotas separadas de Eventos: cuotas son conceptos cobrables; eventos son agenda/calendario.
- Pagos con historial anual: fecha, alumno, concepto, medio de pago, referencia, monto y estado.
- Filtros de pagos por alumno, concepto, estado, medio, fecha desde/hasta y buscador.
- Gastos con fecha, concepto, detalle, responsable, comprobante y adjunto de sustento.
- Tabla de gastos con filtros y botón para descargar sustento adjunto.
- Calendario mensual y agenda anual con eventos y vencimientos.
- Reportes con selector para exportar todo o solo una sección a Excel .xlsx.
- Se conserva Push real FCM preparado de la etapa 30.3.

Notas:

- Los adjuntos se guardan en modo local como datos del navegador. Para producción real conviene pasarlos luego a Supabase Storage.
- Para Vercel no subir node_modules.
