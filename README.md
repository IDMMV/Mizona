# MiZona Enterprise V8 — Etapa 17

## Negocios y Marketplace multiusuario local

Versión acumulativa construida sobre las Etapas 10–16. Continúa funcionando sin Supabase y convierte **Negocios** y **Marketplace** en módulos interactivos compartidos entre perfiles y pestañas del mismo navegador.

## Negocios

- Registro de negocios y servicios locales.
- Publicaciones pendientes para usuarios normales y aprobación inmediata para administradores.
- Reclamo de fichas sin propietario.
- Aprobación o rechazo de reclamos desde el Centro de Control.
- Propietario verificado, negocio afiliado y estado abierto/cerrado.
- Favoritos independientes por perfil.
- Calificaciones y comentarios locales.
- Ofertas visibles en la ficha comercial.
- Contacto mediante MiZona Chat.
- Reportes, suspensión, rechazo y verificación administrativa.
- Métricas de vistas y contactos.

## Marketplace

- Publicación de productos y servicios.
- Imagen local opcional de hasta 1.2 MB.
- Filtros por categoría, condición, precio, distancia y verificación.
- Favoritos independientes por perfil.
- Estado pendiente, activo, pausado, vendido o rechazado.
- Panel de publicaciones propias.
- Contacto con el vendedor mediante solicitud y MiZona Chat.
- Reportes y moderación desde el Centro de Control.
- Restricciones de categorías para perfiles estudiantiles.
- Notificaciones, auditoría y cola de sincronización futura.

## Ejecutar

```bash
npm install
npm run dev
npm run build
```

## Vercel

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

## Estado honesto

Esta etapa comparte información entre pestañas del mismo navegador y dispositivo mediante almacenamiento local. No sincroniza negocios, publicaciones o imágenes entre celulares o computadoras diferentes. No requiere ejecutar SQL.
