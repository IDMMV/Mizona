# MiZona Enterprise V8 - Etapa 30.43.8 Fix sin vercel.json

## Problema corregido

Vercel seguía rechazando el despliegue por:

```text
vercel.json schema validation failed:
installCommand should NOT be longer than 256 characters
```

## Corrección aplicada

- Se eliminó `vercel.json`.
- Ahora los comandos deben configurarse directamente en Vercel Settings.
- Se mantiene `scripts/vercel-install.sh`.
- Se mantiene `.npmrc`.
- Se eliminan lock files.
- Se mantiene Node 24 en package.json.

## Configuración obligatoria en Vercel

En:

```text
Settings → Build and Deployment
```

colocar:

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

## Importante

En GitHub ya NO debe existir `vercel.json` en la raíz.
Si aparece, eliminarlo manualmente.
