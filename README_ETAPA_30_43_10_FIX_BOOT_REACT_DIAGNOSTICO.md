# MiZona Enterprise V8 - Etapa 30.46.1 Fix Boot React Diagnóstico

## Problema

La app publicaba en Vercel, pero quedaba congelada en:

```text
Cargando MiZona...
```

## Corrección

- Se separó el arranque de React.
- `src/main.jsx` ahora importa módulos de forma dinámica.
- Si un módulo falla, muestra el error real en pantalla.
- Se agregó watchdog en `index.html`.
- Ya no se queda congelado sin explicación.
- Se mantiene sin `vercel.json`.
- Se mantiene `scripts/vercel-install.sh`.
- Se mantiene Node 24.
- Se mantiene limpieza de PWA/cache.

## Vercel Settings

```text
Install Command:
bash scripts/vercel-install.sh

Build Command:
npx vite build

Output Directory:
dist
```

Después de publicar abrir:

```text
/?v=304601
```

Si aparece una pantalla de error, copiar ese texto o mandar captura.
