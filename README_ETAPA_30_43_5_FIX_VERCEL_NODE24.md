# MiZona Enterprise V8 - Etapa 30.43.5 Fix Vercel Node 24

## Problema corregido

Vercel mostró:

```text
Node.js version 20.x is deprecated.
Please set "engines": { "node": "24.x" } in your package.json file to use Node.js 24.
```

## Corrección aplicada

- `package.json` ahora usa:

```json
"engines": {
  "node": "24.x"
}
```

- Se mantiene registry público:

```text
https://registry.npmjs.org/
```

- No incluye package-lock.json.
- Build command:

```text
npx vite build
```

## Configuración Vercel recomendada

```text
Install Command:
npm install --registry=https://registry.npmjs.org/ --legacy-peer-deps --no-audit --no-fund

Build Command:
npx vite build

Output Directory:
dist
```

Luego hacer:

```text
Redeploy → Clear build cache
```
