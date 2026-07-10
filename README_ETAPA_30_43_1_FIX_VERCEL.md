# MiZona Enterprise V8 - Etapa 30.43.1 Fix Vercel NPM

## Problema corregido
Vercel falló en `npm install` con:

```text
npm error Exit handler never called!
Command "npm install" exited with 1
```

Ese error ocurre antes del build y normalmente está relacionado con npm/cache/dependencias en Vercel, no con el código de la web.

## Cambios aplicados

- Se agregó `.npmrc` con instalación más estable.
- Se agregó `vercel.json` con:
  - installCommand estable
  - buildCommand
  - outputDirectory
- Se agregó `engines.node` en package.json.
- Se mantiene todo lo de la Etapa 30.43.

## En Vercel
Después de subir esta versión, usar:

```text
Redeploy → sin cache / Clear build cache
```

Si Vercel no muestra esa opción, solo vuelve a desplegar después de subir los archivos.
