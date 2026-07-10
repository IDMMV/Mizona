# MiZona Enterprise V8 - Etapa 30.46.2

## Corrección de build

La 30.46.1 fallaba en Vercel con:

```text
Command "npx vite build" exited with 1
```

Causa encontrada en `src/pages/Chat.jsx`:

```text
catch {}\n    setPage?.('panel');
```

Ese `\n` quedó como texto dentro del JavaScript y rompía la compilación.

## Corrección aplicada

Ahora quedó como código válido:

```js
try { window.history.pushState({ mizonaPage: 'panel', mzPage: 'panel' }, '', '#panel'); } catch {}
setPage?.('panel');
```

## Vercel

Install Command:
```text
bash scripts/vercel-install.sh
```

Build Command:
```text
npx vite build
```

Output Directory:
```text
dist
```

Abrir:
```text
/?v=304602
```
