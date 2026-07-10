# MiZona Enterprise V8 - Etapa 30.43.7 Fix Vercel Script Install

## Problema corregido

Vercel rechazó `vercel.json` porque `installCommand` era demasiado largo:

```text
installCommand should NOT be longer than 256 characters
```

## Corrección aplicada

- Se creó:
```text
scripts/vercel-install.sh
```

- `vercel.json` ahora usa un comando corto:
```text
bash scripts/vercel-install.sh
```

- El script interno:
  - elimina locks
  - limpia proxy
  - limpia caché npm
  - fuerza registry público
  - instala desde `https://registry.npmjs.org/`
  - usa caché temporal `/tmp/mizona-npm-cache`

## Muy importante

En Vercel usar:

```text
Redeploy without cache
```

Si aparece `Restored build cache from previous deployment`, aún está usando caché anterior.

## Configuración Vercel recomendada

```text
Install Command:
bash scripts/vercel-install.sh

Build Command:
npx vite build

Output Directory:
dist
```
