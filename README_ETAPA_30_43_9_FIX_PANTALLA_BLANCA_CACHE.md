# MiZona Enterprise V8 - Etapa 30.46.1 Fix Pantalla Blanca / Caché

## Problema corregido

La app publicaba en Vercel como Ready, pero al abrir mostraba pantalla blanca.

Esto puede ocurrir por:
- caché viejo de PWA / Service Worker
- versiones mezcladas del index y los assets
- error de arranque de React sin mensaje visible

## Cambios aplicados

- Se actualizó el título a 30.46.1.
- Se agregó pantalla de carga visible en `index.html`.
- Se agregó captura de error de arranque en `src/main.jsx`.
- Se desactiva el Service Worker principal de MiZona.
- Se eliminan cachés antiguos `mizona`.
- `public/sw.js` ahora solo limpia cachés y evita servir versiones viejas.
- `manifest.webmanifest` usa `start_url` con versión.
- No incluye `vercel.json`.
- No incluye `package-lock.json`.

## Vercel Settings

```text
Install Command:
bash scripts/vercel-install.sh

Build Command:
npx vite build

Output Directory:
dist
```

Luego:

```text
Redeploy without cache
```

## Después de publicar

Abrir la web con:

```text
https://TU-DOMINIO.vercel.app/?v=304601
```

Si es PWA instalada, cerrar, borrar caché o desinstalar/instalar nuevamente.
