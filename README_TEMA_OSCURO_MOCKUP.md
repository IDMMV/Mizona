# Ajuste de apariencia — Tema oscuro alineado al mockup

## Qué se hizo

Se agregó un nuevo archivo: `src/styles/theme-dark-mockup.css`

Este archivo se importa DESPUÉS de `app.css` (en `main.jsx` y `AppRoot.jsx`), por lo que
sus reglas ganan el conflicto de CSS sin necesidad de tocar ni borrar nada del
archivo `app.css` original (que ya tenía reglas de modo oscuro repetidas y a veces
contradictorias entre distintas etapas).

Es 100% reversible: si algo no te convence, basta con quitar las dos líneas de
`import './styles/theme-dark-mockup.css';` y todo vuelve a como estaba.

## Qué cambia cuando el usuario activa "Modo oscuro" (Ajustes)

- Fondo general oscuro uniforme (navy casi negro), igual en todas las páginas
  (antes cada "etapa" tenía su propio tono).
- Todas las tarjetas de contenido (paneles, tarjetas de curso, negocio, chat,
  marketplace, comités, etc.) ahora comparten el mismo color de superficie oscura.
- Barra inferior móvil, topbar y sidebar consolidados en un solo estilo oscuro.
- Verde de marca más vivo (`#22c55e`) para botones principales, iconos activos
  de la barra inferior y burbujas de chat propias — igual que en el mockup.
- Burbujas de chat: las del otro usuario quedan en superficie oscura, las
  propias en verde de marca.
- Inputs, selects y textareas oscuros con texto legible.
- Los recibos/tickets de venta (`receiptPaper`) se dejaron en blanco a propósito,
  porque simulan papel impreso.
- Las etiquetas de estado (pendiente, rechazado, abierto/cerrado, etc.) se
  mantienen legibles con fondos translúcidos en vez de colores pastel sólidos.

## Siguiente paso sugerido

Este cambio cubre el tema oscuro global. Para que cada pantalla sea un calco
exacto del mockup (por ejemplo el chat con avatares circulares y encabezado
compacto, o el POS con la grilla de productos), conviene revisar pantalla por
pantalla — dime cuál seguimos y la afinamos.

## Publicación en Vercel

Igual que siempre:
- Install Command: `bash scripts/vercel-install.sh`
- Build Command: `npx vite build`
- Output Directory: `dist`
