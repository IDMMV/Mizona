# MiZona Enterprise V8 — Etapa 26

## Pasarela y liquidaciones locales

Versión acumulativa sobre la corrección 25.1. Añade un centro administrativo para preparar proveedores de pago, webhooks, liquidaciones a vendedores, reservas antifraude y devoluciones.

### Incluye

- Proveedores preparados: Manual, Culqi, Niubiz, Izipay, Mercado Pago y Yape Empresas.
- Activación y selección de proveedor.
- Modo sandbox por defecto.
- Simulación de webhooks.
- Saldos retenidos, disponibles, pagados y bloqueados.
- Comisión, reserva antifraude y monto neto.
- Solicitudes de devolución y aprobación administrativa.
- Exportación JSON.
- Diseño adaptado a celular.
- Sin claves secretas en el navegador.

### Estado honesto

No procesa dinero real. Para producción se necesita backend seguro, credenciales del proveedor, webhooks firmados, conciliación bancaria y revisión legal/contable.
