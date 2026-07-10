# MiZona Enterprise V8 - Etapa 30.44 UI real móvil

## Qué corrige

Esta etapa corrige la observación principal: la app cargaba, pero las pantallas reales no se parecían a los modelos aprobados.

## Cambios aplicados

- Chat móvil:
  - elimina título duplicado de MiZona Chat
  - header oscuro más limpio
  - botones superiores solo con iconos
  - conversación oscura completa
  - elimina texto largo del encabezado de conversación
  - botón enviar al lado del micrófono
  - composer fijo inferior sin franja blanca

- Comités:
  - Finanzas, pestañas y tarjetas móviles más claras
  - hero más parecido a app móvil
  - KPIs compactos
  - calendario preparado para scroll horizontal en móvil

- Business:
  - hero más tipo app
  - productos como tarjetas grandes
  - POS más legible en celular
  - carrito debajo en móvil

- Marketplace / Campus / Ride / Beneficios:
  - héroes unificados
  - cards redondeadas
  - carruseles horizontales sin cortar toda la pantalla
  - bottom nav respetado

## Vercel

Mantener:

```text
Install Command:
bash scripts/vercel-install.sh

Build Command:
npx vite build

Output Directory:
dist
```

Abrir después de publicar:

```text
/?v=304400
```
