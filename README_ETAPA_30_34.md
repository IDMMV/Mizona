# MiZona Enterprise V8 - Etapa 30.34

## Enfoque
Estructura general de permisos, Marketplace con carrito por proveedor, pedido registrado recomendado y Zona Ride Delivery preparada pero deshabilitada.

## Cambios incluidos

### Permisos y roles
- Matriz base de roles:
  - Super administrador
  - Administrador de plataforma
  - Adulto
  - Padre de familia
  - Alumno protegido
  - Dueño de negocio
  - Trabajador de negocio
  - Conductor / repartidor
  - Invitado solo chat
  - Invitado temporal
- El rol sugiere permisos, pero el administrador puede controlar qué pestañas ve cada usuario.
- En Centro de Control se agregó pestaña Permisos con matriz de roles y módulos visibles.

### Marketplace
- Marketplace se enfoca en productos, servicios y proveedores dentro del producto/servicio.
- Se evita usar “Negocios” como agenda pública principal.
- Se agregó carrito de compras.
- El carrito agrupa productos por proveedor.
- Si hay varios proveedores, se recomienda crear pedidos separados.
- Cada proveedor solo ve sus productos.
- Se agregó aviso realista de pedido registrado:
  “Te recomendamos registrar tu pedido en MiZona. Así quedará constancia de la operación, podrás confirmar recibido, calificar al proveedor y reportar problemas.”

### Delivery
- Entrega inicial:
  - Recojo en tienda
  - Delivery propio del proveedor
  - Comunicación por MiZona Chat
- Zona Ride Delivery queda preparada pero deshabilitada.

### Zona Ride Delivery
- Nueva página/módulo: Zona Ride Delivery.
- Estado inicial: Próximamente / deshabilitado.
- Visible para administración y futuros motorizados según permisos.
- Preparado para:
  - delivery de productos
  - recojo de pedidos
  - mandados
  - envíos
  - multi-recojo
  - seguimiento futuro por ubicación

## Verificación

```bash
npm install
npm run build
```

Build verificado correctamente.
