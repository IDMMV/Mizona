# MiZona Enterprise V8 - Etapa 30.36

## Enfoque
Conectar Marketplace con MiZona Business para que el proveedor vea y gestione pedidos registrados.

## Cambios incluidos

### MiZona Business
- Nueva pestaña: Pedidos Marketplace.
- El negocio puede ver pedidos creados desde Marketplace.
- Los pedidos se agrupan por estados:
  - registrado
  - aceptado
  - preparando
  - en camino
  - entregado
  - recibido
  - calificado
- El proveedor puede avanzar el estado del pedido.
- El proveedor puede cancelar pedidos.
- Si el cliente califica, el negocio puede ver la calificación y si hubo problema.

### Marketplace
- Al actualizar pedidos, se notifica al resto de la app mediante evento local.
- Mis pedidos se mantiene sincronizado en el mismo dispositivo.

### Flujo probado
Marketplace → carrito por proveedor → pedido registrado → MiZona Business → proveedor actualiza estado → cliente ve avance en Mis pedidos.

## Nota
Esta etapa trabaja con almacenamiento local para pruebas. La siguiente etapa puede llevar estos pedidos a Supabase para que cliente y proveedor los vean desde distintos dispositivos.

## Verificación

```bash
npm install
npm run build
```

Build verificado correctamente.
