# MiZona Enterprise V8 - Etapa 30.43.6 Fix Vercel Cache Lock

## Problema corregido

Vercel seguía usando caché anterior:

```text
Restored build cache from previous deployment
```

y descargaba dependencias desde una URL interna:

```text
packages.applied-caas-gateway1.internal.api.openai.org
```

## Corrección aplicada

- Se elimina cualquier lock file.
- `.npmrc` incluye:
  - registry público
  - package-lock=false
  - cache temporal `/tmp/mizona-npm-cache`
- `vercel.json` limpia:
  - package-lock
  - npm-shrinkwrap
  - yarn.lock
  - pnpm-lock.yaml
  - proxy
  - https-proxy
  - npm cache
- Instalación con:
```text
npm install --registry=https://registry.npmjs.org/ --cache=/tmp/mizona-npm-cache --prefer-online --legacy-peer-deps --no-audit --no-fund
```
- Build:
```text
npx vite build
```

## Muy importante en Vercel

Al hacer Redeploy, usar obligatoriamente:

```text
Redeploy without cache
```

o

```text
Clear build cache
```

Si Vercel vuelve a decir `Restored build cache`, todavía está usando caché antiguo.
