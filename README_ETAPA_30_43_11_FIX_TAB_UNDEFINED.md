# MiZona Enterprise V8 - Etapa 30.43.11 Fix tab is not defined

## Problema corregido

La app mostraba:

```text
tab is not defined
```

## Causa

En `src/pages/Committees.jsx` quedaron dos bloques nuevos (`Finanzas` y `Actas y Documentos`) fuera del `return` principal del componente.

Eso provocaba que el navegador leyera `tab` fuera de su contexto.

## Corrección

- Se movieron los bloques `finance` y `archive` dentro del componente `Committees`.
- Se mantiene la pantalla de diagnóstico si algo vuelve a fallar.
- Se mantiene sin `vercel.json`.
- Se mantiene `scripts/vercel-install.sh`.
- Se mantiene Node 24.
- Se mantiene limpieza de caché/PWA.

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
/?v=304311
```
