# MiZona Enterprise V8 - Etapa 30.43.4 Fix Vercel Node 20 + Supabase

## Problema corregido

Vercel seguía usando Node 20:

```text
current node v20.20.2
```

pero la versión nueva de Supabase pedía Node 22:

```text
@supabase/supabase-js@2.110.2 required node >=22.0.0
```

Eso hacía que `npm install` fallara o quedara incompleto, y luego aparecía:

```text
vite: command not found
```

## Corrección aplicada

- Se fijó Node 20 porque tu Vercel está usando Node 20.
- Se bajó `@supabase/supabase-js` a `2.45.4`, compatible con Node 20.
- Se eliminó `package-lock.json`.
- Se mantiene registry público `https://registry.npmjs.org/`.
- Se cambió build command a `npx vite build`.

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
