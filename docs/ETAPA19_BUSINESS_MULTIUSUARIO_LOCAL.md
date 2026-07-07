# Etapa 19 · MiZona Business multiusuario local

Esta etapa convierte MiZona Business en un módulo funcional de laboratorio local, independiente de Supabase.

## Incluye

- Negocios separados por `business_id`.
- Propietario, administrador, caja, cocina y mozo.
- Selector de negocio según acceso del perfil activo.
- Apertura y cierre de caja con fondo inicial, conteo, monto esperado y diferencia.
- Caja/POS con IGV incluido, efectivo, tarjeta/Yape y cálculo de vuelto.
- Boleta imprimible desde el navegador.
- Pedidos para mostrador, mesa, recojo o delivery.
- Flujo de cocina: nuevo, preparando, listo, entregado.
- Aviso local al personal cuando un pedido está listo.
- Productos, stock mínimo, ajustes y movimientos de inventario.
- Clientes, visitas, consumo acumulado y puntos.
- Personal por usuario exacto.
- Gastos del negocio.
- Reportes y exportación CSV.
- Sincronización entre pestañas mediante `BroadcastChannel`.
- Auditoría, notificaciones y cola local para futura sincronización.

## Seguridad local

Las cuentas estudiantiles no pueden entrar a MiZona Business. Los adultos pueden crear un negocio, mientras que el acceso a las funciones depende del rol asignado.

## Limitación

Los datos se almacenan en el navegador. No se sincronizan entre celulares o computadoras diferentes hasta conectar un backend.
