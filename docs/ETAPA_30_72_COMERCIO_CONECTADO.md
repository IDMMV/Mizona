# MiZona 30.72 — Marketplace y Business conectados

## Objetivo
Conectar las pantallas existentes con el núcleo normalizado de comercio creado en 30.71, conservando almacenamiento local como respaldo cuando no exista conexión.

## Marketplace
- Carga negocios y publicaciones activas desde Supabase.
- Mezcla registros locales y cloud sin duplicarlos.
- Publica localmente primero y sincroniza cuando hay conexión.
- Crea pedidos cloud cuando la publicación pertenece a un negocio real.
- Mantiene pedidos locales para publicaciones sin negocio asociado.
- Muestra el estado: Supabase conectado, sincronizando o respaldo local.
- Recibe actualizaciones mediante Supabase Realtime.

## MiZona Business
- Sincroniza la ficha del negocio y sus productos.
- Consulta pedidos reales asociados al negocio.
- Actualiza estados y los refleja para el comprador.
- Conserva el panel local de caja y cocina como respaldo.
- Corrige el filtro que mostraba pedidos de todos los proveedores.

## SQL acumulado
No ejecutar de manera aislada si se prefiere esperar al cierre. Esta etapa añade:

`supabase/migrations/202607130172_commerce_ui_policies.sql`

Al finalizar todas las etapas se preparará un único SQL consolidado, ordenado y revisado para publicar todo en Supabase.
