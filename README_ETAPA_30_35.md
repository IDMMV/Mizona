# MiZona Enterprise V8 - Etapa 30.35

## Enfoque
Pedido registrado, confirmación de recibido, calificación del proveedor y reputación visible.

## Cambios incluidos

### Marketplace / pedidos
- Se agregó sección real de “Mis pedidos”.
- Cuando el cliente registra el carrito, se crean pedidos separados por proveedor.
- Cada pedido conserva:
  - proveedor
  - productos
  - cantidades
  - subtotal
  - delivery estimado del proveedor
  - total
  - estado
  - fecha y hora
- Los pedidos quedan guardados localmente para pruebas.

### Estados del pedido
- registrado
- aceptado
- preparando
- en camino
- entregado
- recibido
- calificado

### Confirmar recibido
- Botón para confirmar recibido.
- Botón para marcar “recibí con problema”.
- Después de confirmar recibido se abre calificación.

### Calificación y reputación
- Calificación de 1 a 5 estrellas.
- Comentario opcional.
- Opción para reportar problema.
- La calificación queda asociada al pedido.
- En el detalle del producto se muestra confianza del proveedor:
  - proveedor verificado
  - proveedor no verificado
  - recomendación de pedido registrado

### Mensaje realista
No se promete protección falsa. El sistema indica que el pedido registrado sirve para dejar constancia, confirmar recibido, calificar y reportar problemas.

## Verificación

```bash
npm install
npm run build
```

Build verificado correctamente.
