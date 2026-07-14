# MiZona 30.71 — Comercio normalizado

Esta etapa crea la base real para que Marketplace y Business dejen de depender únicamente del navegador.

## Tablas nuevas

- `mz_businesses`
- `mz_business_members`
- `mz_products`
- `mz_marketplace_listings`
- `mz_orders`
- `mz_order_items`

## Seguridad

Las políticas RLS permiten:

- lectura pública solo de negocios, productos y publicaciones activas;
- administración de negocios por propietario o miembros autorizados;
- creación de publicaciones únicamente por el usuario autenticado;
- acceso a pedidos únicamente para comprador, vendedor o integrantes del negocio;
- actualización de estados por el negocio responsable.

## Activación

Ejecuta en Supabase SQL Editor:

`supabase/migrations/202607130171_commerce_core.sql`

Después configura en Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

La aplicación conserva modo local cuando no hay Internet. Las funciones de `src/lib/cloudCommerce.js` son la capa central que usarán las siguientes pantallas.
