# MiZona Enterprise V8 - Etapa 30.43.2 Fix Vercel Registry

## Problema corregido

Vercel fallaba con:

```text
npm error code ETIMEDOUT
npm error network request to https://packages.applied-caas-gateway1.internal.api.openai.org/...
```

Eso pasa cuando `package-lock.json` queda generado con una ruta interna del entorno de desarrollo.

## Corrección aplicada

- Se eliminó `package-lock.json`.
- Se forzó el registry público:
  - `https://registry.npmjs.org/`
- Se actualizó `.npmrc`.
- Se actualizó `vercel.json`.
- Se mantiene todo el núcleo real 30.43.

## Qué hacer en Vercel

Después de subir esta versión:

1. Ir a Deployments.
2. Redeploy.
3. Activar Clear build cache / Redeploy without cache.
4. Verificar que el log diga que instala desde `registry.npmjs.org`.

## Configuración esperada

```text
Install Command:
npm install --registry=https://registry.npmjs.org/ --legacy-peer-deps --no-audit --no-fund

Build Command:
npm run build

Output Directory:
dist
```
